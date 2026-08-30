/**
 * Utility functions for calculating recurring 10-day client posture/body check-in schedules.
 */

export function getNextCheckinInfo(client, clientCheckins = []) {
  if (!client) {
    return {
      nextCheckinDate: '',
      nextCheckinDateFormatted: '--',
      diffDays: null,
      statusText: 'No Client',
      badgeVariant: 'secondary',
      isDue: false,
      isOverdue: false,
      lastCheckinDate: null,
      totalCheckins: 0
    };
  }

  // Filter and sort checkins for this client
  const cList = Array.isArray(clientCheckins) 
    ? clientCheckins.filter(chk => chk.clientId === client.id || chk.clientId === client.uid)
    : [];

  cList.sort((a, b) => {
    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.date ? new Date(a.date).getTime() : 0);
    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.date ? new Date(b.date).getTime() : 0);
    return timeB - timeA;
  });

  const latestCheckin = cList[0];
  let baseDate = null;
  let hasPreviousCheckin = false;

  if (latestCheckin) {
    baseDate = latestCheckin.date 
      ? new Date(latestCheckin.date) 
      : (latestCheckin.createdAt?.seconds ? new Date(latestCheckin.createdAt.seconds * 1000) : new Date());
    hasPreviousCheckin = true;
  } else if (client.planStart) {
    baseDate = new Date(client.planStart);
  } else if (client.createdAt?.seconds) {
    baseDate = new Date(client.createdAt.seconds * 1000);
  } else {
    baseDate = new Date();
  }

  if (isNaN(baseDate.getTime())) {
    baseDate = new Date();
  }

  // 10-day recurring interval
  const nextDate = new Date(baseDate);
  if (hasPreviousCheckin || client.planStart) {
    nextDate.setDate(nextDate.getDate() + 10);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(nextDate);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let statusText = '';
  let badgeVariant = 'success';
  let isDue = false;
  let isOverdue = false;

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    statusText = `Overdue (${overdueDays}d)`;
    badgeVariant = 'danger';
    isDue = true;
    isOverdue = true;
  } else if (diffDays === 0) {
    statusText = 'Due Today 🔥';
    badgeVariant = 'warning';
    isDue = true;
  } else if (diffDays === 1) {
    statusText = 'Due Tomorrow';
    badgeVariant = 'warning';
  } else {
    statusText = `Due in ${diffDays}d`;
    badgeVariant = diffDays <= 3 ? 'warning' : 'success';
  }

  const dateStr = target.toISOString().split('T')[0];
  const dateFormatted = target.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

  return {
    nextCheckinDate: dateStr,
    nextCheckinDateFormatted: dateFormatted,
    diffDays,
    statusText,
    badgeVariant,
    isDue,
    isOverdue,
    lastCheckinDate: latestCheckin ? (latestCheckin.date || (latestCheckin.createdAt?.seconds ? new Date(latestCheckin.createdAt.seconds * 1000).toISOString().split('T')[0] : null)) : null,
    totalCheckins: cList.length
  };
}
