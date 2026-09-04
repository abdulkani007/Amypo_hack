import React, { useState, useEffect } from 'react';
import { 
  Database, Building, DollarSign, Clock, Users, Shield, 
  BookOpen, Phone, MapPin, CheckCircle2, AlertTriangle, Code, RefreshCw
} from 'lucide-react';
import { fetchCollegeDatabase } from './collegeApi';

export default function DatabaseExplorer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('departments');
  const [rawView, setRawView] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const db = await fetchCollegeDatabase();
      setData(db);
    } catch (err) {
      console.error("Failed to load college database:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '60px 0', textAlign: 'center' }}>
        <RefreshCw className="animate-spin" style={{ width: '28px', height: '28px', margin: '0 auto 12px', color: 'var(--accent-green)' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading local mock database...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header Bar */}
      <div className="glass-panel" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database style={{ width: '18px', height: '18px', color: 'var(--accent-green)' }} />
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px', color: '#fff', textTransform: 'uppercase' }}>
              STRUCTURED_DATABASE_EXPLORER
            </h2>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {data?.college?.name} — Local JSON database tables (PS7 Local Retrieval Core)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setRawView(!rawView)}
            style={{
              background: rawView ? 'var(--accent-green)' : 'transparent',
              color: rawView ? '#000' : 'var(--accent-green)',
              border: '1px solid var(--accent-green)',
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 'bold',
              fontFamily: 'var(--font-cyber)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Code style={{ width: '12px', height: '12px' }} />
            <span>{rawView ? 'UI VIEW' : 'RAW JSON'}</span>
          </button>
        </div>
      </div>

      {rawView ? (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span className="card-title">RAW_DATABASE_PAYLOAD (college_data.json)</span>
          <pre style={{ 
            fontSize: '11px', 
            fontFamily: 'var(--font-cyber)', 
            color: 'var(--accent-green)', 
            background: 'var(--bg-darker)',
            padding: '16px',
            overflowX: 'auto',
            maxHeight: '500px',
            border: '1px solid rgba(0, 230, 118, 0.1)'
          }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Navigation Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { id: 'departments', label: 'DEPARTMENTS & FEES', icon: DollarSign },
              { id: 'attendance', label: 'ATTENDANCE RULES', icon: Clock },
              { id: 'hostel', label: 'HOSTEL BLOCKS', icon: Building },
              { id: 'examinations', label: 'EXAM CELL', icon: BookOpen },
              { id: 'contacts', label: 'OFFICE DIRECTORY', icon: Phone }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: isActive ? 'var(--accent-green)' : 'rgba(2, 3, 5, 0.6)',
                    color: isActive ? '#000' : 'var(--text-primary)',
                    border: `1px solid ${isActive ? 'var(--accent-green)' : 'rgba(0, 230, 118, 0.15)'}`,
                    padding: '8px 16px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-cyber)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <Icon style={{ width: '13px', height: '13px' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Departments & Fees */}
          {activeTab === 'departments' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span className="card-title">DEPARTMENT_PROGRAMS_AND_FEE_SCHEDULE</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '12px' }}>
                {data?.departments?.map(dept => (
                  <div 
                    key={dept.code}
                    style={{ 
                      background: 'rgba(2, 3, 5, 0.5)', 
                      border: '1px solid var(--accent-green-dim)', 
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{dept.name} ({dept.code})</span>
                      <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                        ₹{dept.semester_fee.toLocaleString()}/sem
                      </span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      <div>HOD: <span style={{ color: '#fff' }}>{dept.hod}</span></div>
                      <div>Contact: <span style={{ color: '#fff' }}>{dept.email}</span></div>
                      <div>Intake: <span style={{ color: '#fff' }}>{dept.intake} seats/year</span></div>
                    </div>
                    <div style={{ marginTop: '6px', borderTop: '1px dashed rgba(0, 230, 118, 0.1)', paddingTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                      Laboratories: {dept.laboratories.join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Protocol Alert */}
              <div style={{ marginTop: '20px', background: 'rgba(0, 230, 118, 0.03)', border: '1px solid var(--accent-green-dim)', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontSize: '11px', fontWeight: 'bold' }}>
                  <Shield style={{ width: '14px', height: '14px' }} />
                  <span>OFFICIAL PAYMENT GATEWAYS & MODES</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '6px', lineHeight: '1.5' }}>
                  {data?.fees?.payment_rules?.security_warning}
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Attendance Rules */}
          {activeTab === 'attendance' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span className="card-title">ATTENDANCE_REGULATIONS_AND_THRESHOLDS</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '12px' }}>
                <div style={{ background: 'rgba(0, 230, 118, 0.05)', border: '1px solid var(--accent-green)', padding: '18px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--accent-green)', textTransform: 'uppercase' }}>Standard Requirement</span>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: '6px 0' }}>
                    {data?.attendance?.minimum_percentage_required}%
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Mandatory cumulative attendance to sit for end-semester exams.
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 160, 0, 0.05)', border: '1px solid var(--accent-orange)', padding: '18px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--accent-orange)', textTransform: 'uppercase' }}>Medical Condonation</span>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: '6px 0' }}>
                    65.0% - 74.9%
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Permitted with doctor's certificate submitted within 7 days + ₹1,500 fee.
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 61, 0, 0.05)', border: '1px solid var(--accent-red)', padding: '18px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--accent-red)', textTransform: 'uppercase' }}>Strict Detention</span>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: '6px 0' }}>
                    &lt; 65.0%
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Strictly detained from examinations. Must repeat the semester next year.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Hostel Blocks */}
          {activeTab === 'hostel' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span className="card-title">RESIDENTIAL_HOSTEL_FACILITIES</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '12px' }}>
                {data?.hostel?.blocks?.map((block, i) => (
                  <div key={i} style={{ background: 'rgba(2, 3, 5, 0.5)', border: '1px solid var(--accent-green-dim)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{block.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--accent-green)', background: 'var(--accent-green-dim)', padding: '2px 6px' }}>
                        {block.gender}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      <div>Type: {block.rooms}</div>
                      <div>Capacity: {block.capacity} residents</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', background: 'rgba(2, 3, 5, 0.4)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px', fontSize: '11px', lineHeight: '1.6' }}>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>CURFEW & POLICIES:</div>
                <div style={{ color: 'var(--text-muted)' }}>• Curfew: {data?.hostel?.rules?.curfew_time}</div>
                <div style={{ color: 'var(--text-muted)' }}>• AC 2-Sharing: ₹{data?.hostel?.annual_fees?.ac_two_sharing.toLocaleString()}/year (Mess included)</div>
                <div style={{ color: 'var(--text-muted)' }}>• Non-AC 3-Sharing: ₹{data?.hostel?.annual_fees?.non_ac_three_sharing.toLocaleString()}/year (Mess included)</div>
                <div style={{ color: 'var(--text-muted)' }}>• Chief Warden: {data?.hostel?.chief_warden_contact?.name} ({data?.hostel?.chief_warden_contact?.email})</div>
              </div>
            </div>
          )}

          {/* Tab 4: Examinations */}
          {activeTab === 'examinations' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span className="card-title">EXAMINATION_CONTROLLER_RULES</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', fontSize: '11px', color: 'var(--text-primary)' }}>
                <div style={{ background: 'rgba(2, 3, 5, 0.4)', border: '1px solid var(--accent-green-dim)', padding: '14px' }}>
                  <div style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>EXAM REPORTING TIMELINE:</div>
                  <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{data?.examinations?.hall_entry_rules?.reporting_time}</p>
                </div>

                <div style={{ background: 'rgba(2, 3, 5, 0.4)', border: '1px solid var(--accent-green-dim)', padding: '14px' }}>
                  <div style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>MANDATORY DOCUMENTS FOR ENTRY:</div>
                  <ul style={{ paddingLeft: '18px', marginTop: '4px', color: 'var(--text-muted)' }}>
                    {data?.examinations?.hall_entry_rules?.mandatory_documents?.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'rgba(255, 61, 0, 0.05)', border: '1px solid var(--accent-red)', padding: '14px' }}>
                  <div style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>PROHIBITED ELECTRONICS:</div>
                  <ul style={{ paddingLeft: '18px', marginTop: '4px', color: 'var(--text-muted)' }}>
                    {data?.examinations?.hall_entry_rules?.prohibited_devices?.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Contacts Directory */}
          {activeTab === 'contacts' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span className="card-title">INSTITUTIONAL_CONTACT_DIRECTORY</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginTop: '12px' }}>
                {data?.contacts?.map((c, i) => (
                  <div key={i} style={{ background: 'rgba(2, 3, 5, 0.4)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{c.department}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--accent-green)', marginTop: '4px' }}>{c.email}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Phone: {c.phone}</div>
                    <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Location: {c.location}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
