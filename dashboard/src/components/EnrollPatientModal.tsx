import { useState } from "react";
import { createPortal } from "react-dom";
import { X, User, Mail, Phone, Shield, CheckCircle, ChevronRight, Activity, Lock, Fingerprint, FileText, Check, Building } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function EnrollPatientModal({ onClose }: { onClose: () => void }) {
  const createPatient = useMutation(api.patients.createPatient);
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    age: '' as any,
    gender: '',
    email: '',
    phone: '',
    emergencyContact: '',
    department: '',
    initialRiskLevel: '',
    deviceLock: true,
    singleDevice: true,
    consentRequired: true,
    clinicalMonitoring: true,
    emergencyAgreement: true,
    researchParticipation: false
  });

  const handleEnroll = async () => {
    if (!formData.initialRiskLevel) {
      alert("Please select an initial risk level.");
      setStep(2);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createPatient({
        fullName: formData.fullName,
        age: parseInt(formData.age) || 0,
        gender: formData.gender || 'Not specified',
        email: formData.email,
        phone: formData.phone,
        initialRiskLevel: formData.initialRiskLevel,
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to enroll patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case 'low': return '#10B981'; // Muted Green
      case 'moderate': return '#F59E0B'; // Amber
      case 'high': return '#F97316'; // Orange
      case 'critical': return '#EF4444'; // Muted Red
      default: return 'var(--text-secondary)';
    }
  };

  const getRiskBg = (risk: string) => {
    switch(risk) {
      case 'low': return 'rgba(16, 185, 129, 0.15)';
      case 'moderate': return 'rgba(245, 158, 11, 0.15)';
      case 'high': return 'rgba(249, 115, 22, 0.15)';
      case 'critical': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(255,255,255,0.05)';
    }
  };

  const renderRecommendations = () => {
    if (!formData.initialRiskLevel) {
      return <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Awaiting Risk Assessment</div>;
    }

    switch(formData.initialRiskLevel) {
      case 'low':
        return (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Check size={16} color={getRiskColor('low')}/> Self-guided wellness tools</li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Check size={16} color={getRiskColor('low')}/> Monthly check-ins</li>
          </ul>
        );
      case 'moderate':
        return (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Check size={16} color={getRiskColor('moderate')}/> Guided self-help</li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Check size={16} color={getRiskColor('moderate')}/> Weekly emotional monitoring</li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Check size={16} color={getRiskColor('moderate')}/> Reframe exercises prioritized</li>
          </ul>
        );
      case 'high':
        return (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Check size={16} color={getRiskColor('high')}/> Counselor check-in required</li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Check size={16} color={getRiskColor('high')}/> Enhanced monitoring enabled</li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Check size={16} color={getRiskColor('high')}/> Escalation readiness active</li>
          </ul>
        );
      case 'critical':
        return (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Check size={16} color={getRiskColor('critical')}/> Immediate supervisor review</li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Check size={16} color={getRiskColor('critical')}/> Emergency intervention readiness</li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><Check size={16} color={getRiskColor('critical')}/> Restricted therapeutic mode</li>
          </ul>
        );
      default: return null;
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(3, 8, 18, 0.6)', backdropFilter: 'blur(20px)', zIndex: 9999, display: 'flex', flexDirection: 'column', padding: '32px 20px' }}>
      
      {/* Ambient background glows for modal */}
      <div style={{ position: 'absolute', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(29, 78, 216, 0.06) 40%, transparent 65%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}></div>

      <div className="glass-panel animate-fade-in hide-scrollbar" style={{ width: '100%', maxWidth: '1100px', margin: 'auto', flex: '0 1 auto', maxHeight: '100%', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.08), 0 0 40px rgba(59,130,246,0.1)', background: 'rgba(8, 18, 38, 0.95)' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 36px', borderBottom: '1px solid rgba(59, 130, 246, 0.1)', background: 'rgba(6, 14, 30, 0.6)', flex: '0 0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.7), transparent)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 600, color: 'white', marginBottom: '3px', letterSpacing: '-0.02em', fontFamily: "'DM Sans', sans-serif" }}>Enroll New Patient</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem' }}>Create a secure clinical profile and initialize therapeutic monitoring.</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '7px', borderRadius: '50%', transition: 'all 0.2s', flexShrink: 0 }} className="modal-close-btn">
              <X size={20} />
            </button>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '16px', gap: '8px' }}>
             {[1, 2, 3, 4].map(num => (
               <div key={num} style={{ display: 'flex', alignItems: 'center', flex: num < 4 ? 1 : 0 }}>
                 <div style={{ 
                   display: 'flex', alignItems: 'center', gap: '10px',
                   color: step === num ? 'var(--accent-primary)' : step > num ? 'var(--success)' : 'var(--text-secondary)',
                   fontWeight: step === num ? 600 : 500,
                   transition: 'all 0.3s'
                 }}>
                   <div style={{ 
                     width: '26px', height: '26px', borderRadius: '50%', 
                     display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                     background: step === num ? 'rgba(217, 70, 239, 0.2)' : step > num ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                     border: `1px solid ${step === num ? 'var(--accent-primary)' : step > num ? 'var(--success)' : 'rgba(255,255,255,0.1)'}`,
                     boxShadow: step === num ? '0 0 12px rgba(217, 70, 239, 0.4)' : 'none'
                   }}>
                     {step > num ? <Check size={16} /> : num}
                   </div>
                   <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                     {num === 1 ? 'Basic Info' : num === 2 ? 'Clinical' : num === 3 ? 'Security' : 'Consent'}
                   </span>
                 </div>
                 {num < 4 && (
                   <div style={{ flex: 1, height: '1px', background: step > num ? 'var(--success)' : 'rgba(255,255,255,0.05)', margin: '0 12px', borderRadius: '2px', transition: 'all 0.3s' }}></div>
                 )}
               </div>
             ))}
          </div>
        </div>

        {/* 2-Column Content (Scrollable) */}
        <div className="hide-scrollbar" style={{ display: 'flex', alignItems: 'flex-start', padding: '28px 36px', gap: '36px', overflowY: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          
          {/* Left: Form Area */}
          <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column' }}>
            
            {/* STEP 1 */}
            {step === 1 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'DM Sans', sans-serif" }}><User size={18} color="#60a5fa" /> Basic Information</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Full Legal Name</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input type="text" placeholder="John Doe" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} autoFocus />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Preferred Name (Optional)</label>
                    <div className="input-with-icon">
                      <User size={18} className="input-icon" />
                      <input type="text" placeholder="Johnny" value={formData.preferredName} onChange={e => setFormData({...formData, preferredName: e.target.value})} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Age</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="number" 
                        placeholder="25" 
                        value={formData.age} 
                        onChange={e => setFormData({...formData, age: e.target.value})} 
                        className="age-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Gender Identity</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {['Male', 'Female', 'Non-Binary', 'Prefer Not To Say'].map(g => (
                      <div 
                        key={g}
                        onClick={() => setFormData({...formData, gender: g})}
                        style={{
                          padding: '14px 10px',
                          textAlign: 'center',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: 500,
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: `1px solid ${formData.gender === g ? '#3b82f6' : 'rgba(59,130,246,0.12)'}`,
                          background: formData.gender === g ? 'rgba(59,130,246,0.18)' : 'rgba(10,25,55,0.5)',
                          color: formData.gender === g ? '#93c5fd' : 'var(--text-secondary)',
                          boxShadow: formData.gender === g ? '0 4px 16px rgba(59,130,246,0.2)' : 'none',
                          transform: formData.gender === g ? 'translateY(-1px)' : 'none'
                        }}
                      >
                        {g}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={18} className="input-icon" />
                      <input type="email" placeholder="patient@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="input-with-icon">
                      <Phone size={18} className="input-icon" />
                      <input type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <div className="input-with-icon">
                      <Shield size={18} className="input-icon" />
                      <input type="tel" placeholder="Next of Kin Phone" value={formData.emergencyContact} onChange={e => setFormData({...formData, emergencyContact: e.target.value})} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Department / Campus (Optional)</label>
                    <div className="input-with-icon">
                      <Building size={18} className="input-icon" />
                      <input type="text" placeholder="Psychology Dept." value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <h3 style={{ fontSize: '1.3rem', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: "'DM Sans', sans-serif" }}><Activity size={22} color="var(--accent-primary)" /> Clinical Information</h3>
                
                <div className="form-group">
                  <label>Initial Risk Assessment Level</label>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Select the initial triage level based on intake evaluation. This dictates the patient's therapeutic track.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {['low', 'moderate', 'high', 'critical'].map(r => (
                      <div 
                        key={r}
                        onClick={() => setFormData({...formData, initialRiskLevel: r})}
                        style={{ 
                          padding: '16px', 
                          borderRadius: '10px', 
                          border: `1px solid ${formData.initialRiskLevel === r ? getRiskColor(r) : 'rgba(59,130,246,0.1)'}`,
                          background: formData.initialRiskLevel === r ? getRiskBg(r) : 'rgba(10,25,55,0.5)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: formData.initialRiskLevel === r ? `0 0 20px ${getRiskBg(r)}` : 'none',
                          transform: formData.initialRiskLevel === r ? 'translateY(-1px)' : 'none'
                        }}
                      >
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: formData.initialRiskLevel === r ? getRiskColor(r) : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }}></div>
                        <span style={{ color: formData.initialRiskLevel === r ? 'white' : 'var(--text-secondary)', textTransform: 'capitalize', fontWeight: formData.initialRiskLevel === r ? 600 : 500, fontSize: '1.05rem' }}>{r} Risk</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                 <h3 style={{ fontSize: '1.3rem', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: "'DM Sans', sans-serif" }}><Shield size={22} color="var(--accent-primary)" /> Security & Access Setup</h3>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="toggle-row" onClick={() => setFormData({...formData, deviceLock: !formData.deviceLock})}>
                      <div>
                        <h4 style={{ color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Lock size={16}/> Device Lock Enabled</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Require FaceID/Biometrics to open the mobile application.</p>
                      </div>
                      <div className={`custom-toggle ${formData.deviceLock ? 'active' : ''}`}></div>
                    </div>

                    <div className="toggle-row" onClick={() => setFormData({...formData, singleDevice: !formData.singleDevice})}>
                      <div>
                        <h4 style={{ color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Fingerprint size={16}/> Single Device Enforcement</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Bind the account to a single mobile hardware fingerprint.</p>
                      </div>
                      <div className={`custom-toggle ${formData.singleDevice ? 'active' : ''}`}></div>
                    </div>
                 </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                 <h3 style={{ fontSize: '1.3rem', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: "'DM Sans', sans-serif" }}><FileText size={22} color="var(--accent-primary)" /> Consent & Confirmation</h3>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label className="checkbox-row">
                      <input type="checkbox" checked={formData.consentRequired} onChange={e => setFormData({...formData, consentRequired: e.target.checked})} />
                      <span>
                        <strong style={{ display: 'block', color: 'white', marginBottom: '4px' }}>Patient consent required on first login</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block' }}>User must digitally sign the therapeutic agreement before accessing tools.</span>
                      </span>
                    </label>

                    <label className="checkbox-row">
                      <input type="checkbox" checked={formData.clinicalMonitoring} onChange={e => setFormData({...formData, clinicalMonitoring: e.target.checked})} />
                      <span>
                        <strong style={{ display: 'block', color: 'white', marginBottom: '4px' }}>Clinical monitoring enabled</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block' }}>Allow dashboard to receive real-time emotional logs and screening scores.</span>
                      </span>
                    </label>

                    <label className="checkbox-row">
                      <input type="checkbox" checked={formData.emergencyAgreement} onChange={e => setFormData({...formData, emergencyAgreement: e.target.checked})} />
                      <span>
                        <strong style={{ display: 'block', color: 'white', marginBottom: '4px' }}>Emergency escalation agreement</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block' }}>Acknowledge that severe flags will trigger institutional crisis protocols.</span>
                      </span>
                    </label>

                    <label className="checkbox-row">
                      <input type="checkbox" checked={formData.researchParticipation} onChange={e => setFormData({...formData, researchParticipation: e.target.checked})} />
                      <span>
                        <strong style={{ display: 'block', color: 'white', marginBottom: '4px' }}>Research participation optional</strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block' }}>Allow anonymized data to be exported for clinical trials.</span>
                      </span>
                    </label>
                 </div>
                 <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>By clicking Create Patient Profile, you confirm that you have verified the patient's identity according to institutional guidelines.</p>
              </div>
            )}

          </div>

          {/* Right: Live Summary Panel */}
          <div style={{ flex: '1', position: 'sticky', top: 0 }}>
            <div style={{ background: 'rgba(6, 14, 28, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(59,130,246,0.12)', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(16px)' }}>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(29,78,216,0.25))', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={24} color="#60a5fa" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: 'white', margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{formData.preferredName || formData.fullName || 'New Patient'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    {formData.initialRiskLevel ? (
                      <span style={{ padding: '4px 12px', background: getRiskBg(formData.initialRiskLevel), color: getRiskColor(formData.initialRiskLevel), borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', border: `1px solid ${getRiskColor(formData.initialRiskLevel)}30` }}>
                        {formData.initialRiskLevel} Risk
                      </span>
                    ) : (
                      <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.1)' }}>
                        Risk Pending
                      </span>
                    )}
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Enrollment Pending</span>
                  </div>
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
               <div>
                 <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#60a5fa', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: 600 }}>Patient Summary</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', background: 'rgba(6,14,28,0.5)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.1)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>Full Name:</span> <span style={{ color: formData.fullName ? 'white' : 'var(--text-secondary)', fontStyle: formData.fullName ? 'normal' : 'italic', fontWeight: formData.fullName ? 600 : 400, fontSize: '0.88rem', textAlign: 'right', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.fullName || 'Awaiting…'}</span></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>Age:</span> <span style={{ color: formData.age ? 'white' : 'var(--text-secondary)', fontStyle: formData.age ? 'normal' : 'italic', fontWeight: formData.age ? 600 : 400, fontSize: '0.88rem' }}>{formData.age ? formData.age : 'Awaiting…'}</span></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>Gender:</span> <span style={{ color: formData.gender ? 'white' : 'var(--text-secondary)', fontStyle: formData.gender ? 'normal' : 'italic', fontWeight: formData.gender ? 600 : 400, fontSize: '0.88rem' }}>{formData.gender || 'Awaiting…'}</span></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>Contact:</span> <span style={{ color: formData.phone || formData.email ? 'white' : 'var(--text-secondary)', fontStyle: formData.phone || formData.email ? 'normal' : 'italic', fontWeight: formData.phone || formData.email ? 600 : 400, fontSize: '0.88rem' }}>{formData.phone || formData.email || 'Awaiting…'}</span></div>
                 </div>
               </div>

               <div>
                 <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#60a5fa', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: 600 }}>Security Status</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.88rem', background: 'rgba(6,14,28,0.5)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.1)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: formData.deviceLock ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 500 }}><Lock size={16}/> Device Lock {formData.deviceLock ? 'Enabled' : 'Disabled'}</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: formData.singleDevice ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 500 }}><Fingerprint size={16}/> Single Device {formData.singleDevice ? 'Active' : 'Off'}</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)', fontWeight: 500 }}><Shield size={16}/> Secure Credentials Pending</div>
                 </div>
               </div>

               <div>
                 <h4 style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#60a5fa', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: 600 }}>Recommended Track</h4>
                 <div style={{ padding: '14px', background: formData.initialRiskLevel ? getRiskBg(formData.initialRiskLevel) : 'rgba(6,14,28,0.5)', borderRadius: '10px', border: formData.initialRiskLevel ? `1px solid ${getRiskColor(formData.initialRiskLevel)}35` : '1px solid rgba(59,130,246,0.1)' }}>
                    {renderRecommendations()}
                 </div>
               </div>

             </div>
            </div>
          </div>
          
        </div>

        {/* Footer Actions */}
        <div style={{ flex: '0 0 auto', padding: '14px 36px', borderTop: '1px solid rgba(59, 130, 246, 0.1)', background: 'rgba(6, 14, 30, 0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ opacity: 0.8, padding: '12px 24px', fontSize: '1rem' }}>Cancel Enrollment</button>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            {step > 1 && (
              <button className="btn btn-secondary" onClick={() => setStep(step - 1)} style={{ padding: '12px 24px', fontSize: '1rem' }}>Back</button>
            )}
            {step < 4 ? (
              <button className="btn btn-primary" onClick={() => setStep(step + 1)} style={{ padding: '12px 32px', fontSize: '1rem' }}>Continue <ChevronRight size={18} /></button>
            ) : (
              <button className="btn btn-primary" onClick={handleEnroll} disabled={isSubmitting} style={{ padding: '12px 32px', fontSize: '1rem', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', boxShadow: '0 8px 24px rgba(217, 70, 239, 0.4)' }}>
                {isSubmitting ? 'Creating Profile...' : 'Create Patient Profile'} <CheckCircle size={18} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  , document.body);
}
