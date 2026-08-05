'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getClientCheckins, getClientDailyLogs } from '@/lib/firestore';
import Tabs from '@/components/ui/Tabs';
import Card from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Loading';
import EmptyState from '@/components/ui/EmptyState';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

export default function ProgressPage() {
  const { user } = useAuth();
  const [checkins, setCheckins] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      Promise.all([
        getClientCheckins(user.uid),
        getClientDailyLogs(user.uid)
      ]).then(([checkinsData, logsData]) => {
        // Sort ascending by date for chronological charts
        const sortedCheckins = checkinsData.sort((a, b) => new Date(a.date) - new Date(b.date));
        setCheckins(sortedCheckins);
        setLogs(logsData);
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><Spinner /></div>;

  if (checkins.length === 0 && logs.length === 0) {
    return <EmptyState title="No Progress Data" message="Submit a check-in or daily log to start seeing your progress history." icon="📈" />;
  }

  // Reverse checkins for latest-first list views
  const reversedCheckins = [...checkins].reverse();

  // 1. Weight Data
  const weightData = checkins.map(c => ({
    date: new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: c.measurements?.weight ? parseFloat(c.measurements.weight) : 0,
    fullDate: c.date
  })).filter(d => d.weight > 0);

  // 2. Measurements Data (First vs Latest)
  const firstCheckin = checkins.find(c => c.measurements && Object.keys(c.measurements).length > 0) || {};
  const latestCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : {};

  const measurementsChartData = [
    {
      name: 'Chest',
      first: parseFloat(firstCheckin.measurements?.chest || 0),
      latest: parseFloat(latestCheckin.measurements?.chest || 0),
    },
    {
      name: 'Waist',
      first: parseFloat(firstCheckin.measurements?.waist || 0),
      latest: parseFloat(latestCheckin.measurements?.waist || 0),
    },
    {
      name: 'Abdomen',
      first: parseFloat(firstCheckin.measurements?.abdomen || 0),
      latest: parseFloat(latestCheckin.measurements?.abdomen || 0),
    },
    {
      name: 'Hip',
      first: parseFloat(firstCheckin.measurements?.hip || 0),
      latest: parseFloat(latestCheckin.measurements?.hip || 0),
    }
  ];

  // 4. Compliance Data
  const totalLogs = logs.length;
  const dietLogs = logs.filter(l => l.dietCompleted).length;
  const workoutLogs = logs.filter(l => l.workoutCompleted).length;

  const dietCompliance = totalLogs > 0 ? Math.round((dietLogs / totalLogs) * 100) : 0;
  const workoutCompliance = totalLogs > 0 ? Math.round((workoutLogs / totalLogs) * 100) : 0;

  const dietData = [
    { name: 'Completed', value: dietCompliance },
    { name: 'Missed', value: 100 - dietCompliance },
  ];

  const workoutData = [
    { name: 'Completed', value: workoutCompliance },
    { name: 'Missed', value: 100 - workoutCompliance },
  ];

  const COLORS = ['#00c853', '#2a2a30'];
  const WORKOUT_COLORS = ['#E00008', '#2a2a30'];

  // Helper for trend arrows
  const getTrend = (current, previous) => {
    if (!current || !previous) return <span style={{ color: 'var(--text-secondary)' }}>-</span>;
    const diff = current - previous;
    if (diff > 0) return <span style={{ color: 'var(--accent)' }}>↑ +{diff.toFixed(1)}</span>;
    if (diff < 0) return <span style={{ color: 'var(--success)' }}>↓ {diff.toFixed(1)}</span>;
    return <span style={{ color: 'var(--text-secondary)' }}>-</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
      <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 600 }}>Progress Tracking</h2>
      
      <Tabs tabs={[
        {
          id: 'weight',
          label: 'Weight Trend',
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Card style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 500 }}>Weight Overview</h3>
                {weightData.length > 0 ? (
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E00008" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#E00008" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text)' }}
                          itemStyle={{ color: '#E00008' }}
                        />
                        <Area type="monotone" dataKey="weight" stroke="#E00008" strokeWidth={2} fillOpacity={1} fill="url(#colorWeight)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>Not enough weight data to display chart.</div>
                )}
              </Card>

              <Card style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 500 }}>Weight Log</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {reversedCheckins.filter(c => c.measurements?.weight).map((c, i) => {
                    const prevCheckin = reversedCheckins[i + 1];
                    const currentWeight = parseFloat(c.measurements.weight);
                    const prevWeight = prevCheckin && prevCheckin.measurements?.weight ? parseFloat(prevCheckin.measurements.weight) : null;
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{new Date(c.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{currentWeight} kg</span>
                          <div style={{ width: '70px', textAlign: 'right', fontSize: '0.9rem' }}>
                            {getTrend(currentWeight, prevWeight)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {reversedCheckins.filter(c => c.measurements?.weight).length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No weight logs available.</div>
                  )}
                </div>
              </Card>
            </div>
          )
        },
        {
          id: 'measurements',
          label: 'Measurements',
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Card style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: 500 }}>Overall Progress</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={measurementsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a30" vertical={false} />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1e', borderColor: '#2a2a30', borderRadius: '8px', color: '#fff' }}
                        cursor={{ fill: '#2a2a30', opacity: 0.4 }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Bar dataKey="first" name="First Log" fill="#555555" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="latest" name="Latest Log" fill="#E00008" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card style={{ padding: '0', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 20px 10px' }}>
                  <h3 style={{ margin: '0', fontSize: '1.1rem', fontWeight: 500 }}>Measurement History</h3>
                </div>
                <div style={{ overflowX: 'auto', padding: '0 20px 20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '500px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: 500 }}>Date</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: 500 }}>Chest</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: 500 }}>Waist</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: 500 }}>Abdomen</th>
                        <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontWeight: 500 }}>Hip</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reversedCheckins.map((c, i) => {
                        const prev = reversedCheckins[i + 1] || {};
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>{new Date(c.date).toLocaleDateString()}</td>
                            <td style={{ padding: '12px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{c.measurements?.chest || '--'}</span>
                                <span style={{ fontSize: '0.75rem', width: '40px' }}>{getTrend(c.measurements?.chest, prev.measurements?.chest)}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{c.measurements?.waist || '--'}</span>
                                <span style={{ fontSize: '0.75rem', width: '40px' }}>{getTrend(c.measurements?.waist, prev.measurements?.waist)}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{c.measurements?.abdomen || '--'}</span>
                                <span style={{ fontSize: '0.75rem', width: '40px' }}>{getTrend(c.measurements?.abdomen, prev.measurements?.abdomen)}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{c.measurements?.hip || '--'}</span>
                                <span style={{ fontSize: '0.75rem', width: '40px' }}>{getTrend(c.measurements?.hip, prev.measurements?.hip)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {reversedCheckins.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>No measurements available.</div>
                  )}
                </div>
              </Card>
            </div>
          )
        },
        {
          id: 'photos',
          label: 'Photos',
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {reversedCheckins.filter(c => c.photos || c.photoFront || c.photoBack || c.photoLeft || c.photoRight).map((c, i) => {
                const getPhoto = (pos) => {
                  if (c.photos && c.photos[pos]) return c.photos[pos];
                  const camelPos = 'photo' + pos.charAt(0).toUpperCase() + pos.slice(1);
                  return c[camelPos] || null;
                };
                
                const front = getPhoto('front');
                const back = getPhoto('back');
                const left = getPhoto('left');
                const right = getPhoto('right');

                if (!front && !back && !left && !right) return null;

                const Placeholder = ({ label }) => (
                  <div style={{ 
                    width: '100%', aspectRatio: '3/4', background: 'var(--bg)', 
                    borderRadius: '8px', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', color: 'var(--text-secondary)',
                    border: '1px dashed var(--border)', fontSize: '0.8rem'
                  }}>
                    No {label}
                  </div>
                );

                return (
                  <Card key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500 }}>{new Date(c.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Front</p>
                        {front ? <img src={front} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} alt="Front" /> : <Placeholder label="Front" />}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Left</p>
                        {left ? <img src={left} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} alt="Left" /> : <Placeholder label="Left" />}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Right</p>
                        {right ? <img src={right} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} alt="Right" /> : <Placeholder label="Right" />}
                      </div>
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Back</p>
                        {back ? <img src={back} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }} alt="Back" /> : <Placeholder label="Back" />}
                      </div>
                    </div>
                  </Card>
                );
              })}
              {reversedCheckins.filter(c => c.photos || c.photoFront || c.photoBack || c.photoLeft || c.photoRight).length === 0 && (
                <EmptyState title="No Photos" message="Upload photos in your check-ins to see a timeline here." icon="📷" />
              )}
            </div>
          )
        },
        {
          id: 'compliance',
          label: 'Compliance',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <Card style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 500, alignSelf: 'flex-start' }}>Diet Adherence</h3>
                
                <div style={{ width: '200px', height: '200px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dietData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        {dietData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>{dietCompliance}%</span>
                  </div>
                </div>

                <div style={{ width: '100%', marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>Completion</span>
                    <span>{dietLogs} / {totalLogs} Days</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${dietCompliance}%`, height: '100%', background: 'var(--success)', borderRadius: '4px', transition: 'width 1s ease-in-out' }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 500, alignSelf: 'flex-start' }}>Workout Completion</h3>
                
                <div style={{ width: '200px', height: '200px', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={workoutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        {workoutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={WORKOUT_COLORS[index % WORKOUT_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{workoutCompliance}%</span>
                  </div>
                </div>

                <div style={{ width: '100%', marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>Completion</span>
                    <span>{workoutLogs} / {totalLogs} Days</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${workoutCompliance}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px', transition: 'width 1s ease-in-out' }} />
                  </div>
                </div>
              </Card>
            </div>
          )
        }
      ]} />
    </div>
  );
}
