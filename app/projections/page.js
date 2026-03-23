'use client';
import { useState, useEffect, useCallback } from 'react';

const fmt = (n) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString('es-AR')}`;
};
const pct = (n) => `${n}%`;

export default function ProjectionsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [whatIfBoost, setWhatIfBoost] = useState(10);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [activeTab, setActiveTab] = useState('executive');

  const fetchData = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/projections${refresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'API error');
      setData(json);
      // Set default what-if from precomputed scenarios
      const scenario10 = json.whatIfScenarios?.find(s => s.boostPercent === 10);
      if (scenario10) setWhatIfResult(scenario10);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // What-if slider handler
  const handleWhatIfChange = (val) => {
    setWhatIfBoost(val);
    if (!data) return;
    const precomputed = data.whatIfScenarios?.find(s => s.boostPercent === val);
    if (precomputed) {
      setWhatIfResult(precomputed);
    } else {
      // For non-precomputed values, do client-side estimation
      const closest = data.whatIfScenarios?.reduce((prev, curr) =>
        Math.abs(curr.boostPercent - val) < Math.abs(prev.boostPercent - val) ? curr : prev
      );
      if (closest) {
        const ratio = val / closest.boostPercent;
        setWhatIfResult({
          ...closest,
          boostPercent: val,
          totalExtraGmv: Math.round(closest.totalExtraGmv * ratio),
          totalExtraRevenue: Math.round(closest.totalExtraRevenue * ratio),
          sellerImpacts: closest.sellerImpacts.map(s => ({
            ...s,
            extraGmv: Math.round(s.extraGmv * ratio),
            extraRevenue: Math.round(s.extraRevenue * ratio),
          })),
        });
      }
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}>V</div>
          <div>Cargando proyecciones...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a' }}>
        <div style={{ textAlign: 'center', color: '#ef4444', background: '#1e293b', padding: '40px', borderRadius: '16px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>Error</div>
          <div style={{ color: '#94a3b8' }}>{error}</div>
          <button onClick={() => fetchData(true)} style={{ marginTop: '16px', background: '#3b82f6', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '8px', cursor: 'pointer' }}>Reintentar</button>
        </div>
      </div>
    );
  }

  const { marketplace, sellers, pareto, meta } = data;

  // Sort sellers by GMV for display
  const sortedSellers = [...(sellers || [])].sort((a, b) =>
    (b.runRate?.currentGmv || 0) - (a.runRate?.currentGmv || 0)
  );

  const selected = selectedSeller
    ? sellers.find(s => s.id === selectedSeller)
    : null;

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style jsx global>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .proj-card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; transition: transform 0.15s, box-shadow 0.15s; }
        .proj-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .proj-grid { display: grid; gap: 16px; }
        .proj-tab { background: none; border: none; color: #94a3b8; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .proj-tab:hover { color: #e2e8f0; }
        .proj-tab.active { color: #3b82f6; border-bottom-color: #3b82f6; }
        .seller-row { display: grid; grid-template-columns: 200px 1fr 100px 120px 100px 80px; align-items: center; padding: 12px 16px; border-bottom: 1px solid #1e293b; cursor: pointer; transition: background 0.15s; }
        .seller-row:hover { background: #1e293b; }
        .progress-bar { height: 8px; border-radius: 4px; background: #334155; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .metric-card { text-align: center; }
        .metric-value { font-size: 28px; font-weight: 800; line-height: 1.2; }
        .metric-label { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .alert-red { background: #450a0a; border: 1px solid #dc2626; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }
        .slider-container { position: relative; width: 100%; }
        .slider-container input[type=range] { width: 100%; height: 6px; -webkit-appearance: none; appearance: none; background: #334155; border-radius: 3px; outline: none; }
        .slider-container input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #3b82f6; cursor: pointer; border: 2px solid #1e293b; }
        .detail-modal { position: fixed; top: 0; right: 0; width: 480px; height: 100vh; background: #1e293b; border-left: 1px solid #334155; overflow-y: auto; z-index: 100; padding: 24px; box-shadow: -8px 0 32px rgba(0,0,0,0.4); }
        .detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99; }
        @media (max-width: 768px) {
          .seller-row { grid-template-columns: 1fr 1fr; gap: 8px; }
          .detail-modal { width: 100%; }
          .proj-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderBottom: '1px solid #334155', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>
            V-Intel <span style={{ color: '#3b82f6', fontSize: '12px', verticalAlign: 'super' }}>PROJECTIONS</span>
          </h1>
          <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
            Sprint Final Marzo 2026 &middot; {meta.daysRemaining} dias restantes &middot; {meta.responseTimeMs}ms
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => fetchData(true)} disabled={loading} style={{ background: '#334155', color: '#e2e8f0', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            {loading ? 'Actualizando...' : 'Refrescar'}
          </button>
          <a href="/" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>Comparador</a>
        </div>
      </div>

      {/* TABS */}
      <div style={{ borderBottom: '1px solid #334155', padding: '0 24px', display: 'flex', gap: '4px' }}>
        {[
          { key: 'executive', label: 'Tablero Ejecutivo' },
          { key: 'sellers', label: 'Sellers' },
          { key: 'simulator', label: 'Simulador What-If' },
        ].map(tab => (
          <button key={tab.key} className={`proj-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>
        ))}
      </div>

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* ═══════════════════ TAB: EXECUTIVE ═══════════════════ */}
        {activeTab === 'executive' && (
          <>
            {/* KPI Cards */}
            <div className="proj-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '24px' }}>
              <div className="proj-card metric-card">
                <div className="metric-value" style={{ color: '#3b82f6' }}>{fmt(marketplace.totalCurrentGmv)}</div>
                <div className="metric-label">GMV Actual</div>
              </div>
              <div className="proj-card metric-card">
                <div className="metric-value" style={{ color: marketplace.totalProjectedGmv >= marketplace.totalTarget ? '#10b981' : '#f59e0b' }}>{fmt(marketplace.totalProjectedGmv)}</div>
                <div className="metric-label">GMV Proyectado</div>
              </div>
              <div className="proj-card metric-card">
                <div className="metric-value" style={{ color: '#8b5cf6' }}>{fmt(marketplace.totalTarget)}</div>
                <div className="metric-label">Target Mensual</div>
              </div>
              <div className="proj-card metric-card">
                <div className="metric-value" style={{ color: marketplace.completionPercent >= 70 ? '#10b981' : '#ef4444' }}>{pct(marketplace.completionPercent)}</div>
                <div className="metric-label">Completado</div>
              </div>
              <div className="proj-card metric-card">
                <div className="metric-value" style={{ color: '#06b6d4' }}>{fmt(marketplace.totalCurrentRevenue)}</div>
                <div className="metric-label">Revenue (Comision)</div>
              </div>
              <div className="proj-card metric-card">
                <div className="metric-value" style={{ color: '#f59e0b' }}>{fmt(marketplace.totalGap)}</div>
                <div className="metric-label">Gap al Target</div>
              </div>
            </div>

            {/* Global Progress Bar */}
            <div className="proj-card" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Progreso Global GMV</span>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{pct(marketplace.completionPercent)} del target</span>
              </div>
              <div className="progress-bar" style={{ height: '12px' }}>
                <div className="progress-fill" style={{ width: `${Math.min(100, marketplace.completionPercent)}%`, background: marketplace.completionPercent >= 70 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                <span>Dia {meta.daysElapsed} de {meta.daysInMonth}</span>
                <span>Quedan {meta.daysRemaining} dias</span>
              </div>
            </div>

            {/* Pareto Alerts */}
            {pareto.alerts.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444', marginBottom: '12px' }}>Alertas Pareto (Core Sellers)</h3>
                {pareto.alerts.map((alert, i) => (
                  <div key={i} className="alert-red">
                    <div style={{ fontWeight: '700', fontSize: '13px' }}>{alert.message}</div>
                    <div style={{ fontSize: '12px', color: '#fca5a5', marginTop: '4px' }}>
                      Historico promedio: {fmt(alert.historicalAvgGmv)} | Proyectado: {fmt(alert.projectedGmv)} | Caida: {alert.dropPercent}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sellers Quick Table */}
            <div className="proj-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 16px 8px', fontSize: '14px', fontWeight: '700' }}>Ranking de Sellers</div>
              <div style={{ fontSize: '11px', color: '#64748b', padding: '0 16px 8px', display: 'grid', gridTemplateColumns: '200px 1fr 100px 120px 100px 80px' }}>
                <span>Seller</span><span>Progreso</span><span>Score</span><span>GMV Actual</span><span>Revenue</span><span>Estado</span>
              </div>
              {sortedSellers.map(seller => {
                const rr = seller.runRate;
                const os = seller.opportunityScore;
                const pf = seller.profitability;
                const completion = rr?.completionPercent || 0;
                return (
                  <div key={seller.id} className="seller-row" onClick={() => setSelectedSeller(seller.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: seller.config.brandColor }} />
                      <span style={{ fontWeight: '600', fontSize: '13px' }}>{seller.config.shortName}</span>
                    </div>
                    <div style={{ paddingRight: '16px' }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(100, completion)}%`, background: completion >= 75 ? '#10b981' : completion >= 50 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{pct(completion)}</div>
                    </div>
                    <div>
                      <span className="badge" style={{ background: `${os.badge.color}20`, color: os.badge.color }}>{os.score}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{fmt(rr?.currentGmv || 0)}</div>
                    <div style={{ fontSize: '13px', color: '#06b6d4' }}>{fmt(pf?.currentRevenue || 0)}</div>
                    <div>
                      {rr?.onTrack
                        ? <span className="badge" style={{ background: '#064e3b', color: '#34d399' }}>On Track</span>
                        : <span className="badge" style={{ background: '#450a0a', color: '#f87171' }}>En Riesgo</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══════════════════ TAB: SELLERS ═══════════════════ */}
        {activeTab === 'sellers' && (
          <div className="proj-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
            {sortedSellers.map(seller => {
              const rr = seller.runRate;
              const os = seller.opportunityScore;
              const pf = seller.profitability;
              return (
                <div key={seller.id} className="proj-card" style={{ borderLeft: `4px solid ${seller.config.brandColor}`, cursor: 'pointer' }} onClick={() => setSelectedSeller(seller.id)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '16px' }}>{seller.config.shortName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{seller.config.category}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="badge" style={{ background: `${os.badge.color}20`, color: os.badge.color, fontSize: '18px', padding: '4px 14px' }}>{os.score}</div>
                      <div style={{ fontSize: '10px', color: os.badge.color, marginTop: '2px' }}>{os.badge.label}</div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="progress-bar" style={{ marginBottom: '12px' }}>
                    <div className="progress-fill" style={{ width: `${Math.min(100, rr?.completionPercent || 0)}%`, background: seller.config.brandColor }} />
                  </div>

                  {/* Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                    <div>
                      <div style={{ color: '#94a3b8' }}>GMV Actual</div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{fmt(rr?.currentGmv || 0)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Target</div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{fmt(rr?.target || 0)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Diario Actual</div>
                      <div style={{ fontWeight: '600' }}>{fmt(rr?.currentDailyRate || 0)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Diario Necesario</div>
                      <div style={{ fontWeight: '600', color: rr?.onTrack ? '#10b981' : '#ef4444' }}>{fmt(rr?.dailyTargetRemaining || 0)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Tasa Cancel.</div>
                      <div style={{ fontWeight: '600', color: rr?.cancelRate > 5 ? '#ef4444' : '#10b981' }}>{pct(rr?.cancelRate || 0)}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Revenue</div>
                      <div style={{ fontWeight: '600', color: '#06b6d4' }}>{fmt(pf?.currentRevenue || 0)}</div>
                    </div>
                  </div>

                  {/* Action Badge */}
                  <div style={{ marginTop: '12px', padding: '8px 12px', background: `${os.badge.color}10`, borderRadius: '8px', fontSize: '11px', color: os.badge.color, lineHeight: '1.4' }}>
                    {os.badge.action}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════════════ TAB: SIMULATOR ═══════════════════ */}
        {activeTab === 'simulator' && (
          <>
            <div className="proj-card" style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700' }}>Simulador "What-If" de Sprint Final</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px' }}>
                Simula el impacto de una campana de empuje (envio gratis / cupones) sobre los Sellers Estrella (Score &gt; 80)
              </p>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Incremento en pedidos</span>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6' }}>+{whatIfBoost}%</span>
                </div>
                <div className="slider-container">
                  <input type="range" min="1" max="30" value={whatIfBoost} onChange={(e) => handleWhatIfChange(parseInt(e.target.value))} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  <span>+1%</span><span>+15%</span><span>+30%</span>
                </div>
              </div>

              {whatIfResult && (
                <div className="proj-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '16px' }}>
                  <div className="proj-card metric-card" style={{ background: '#0f172a' }}>
                    <div className="metric-value" style={{ color: '#10b981' }}>+{fmt(whatIfResult.totalExtraGmv)}</div>
                    <div className="metric-label">GMV Extra Estimado</div>
                  </div>
                  <div className="proj-card metric-card" style={{ background: '#0f172a' }}>
                    <div className="metric-value" style={{ color: '#06b6d4' }}>+{fmt(whatIfResult.totalExtraRevenue)}</div>
                    <div className="metric-label">Revenue Extra (Comision)</div>
                  </div>
                  <div className="proj-card metric-card" style={{ background: '#0f172a' }}>
                    <div className="metric-value" style={{ color: '#f59e0b' }}>{whatIfResult.starSellersCount}</div>
                    <div className="metric-label">Sellers Estrella Impactados</div>
                  </div>
                </div>
              )}
            </div>

            {/* Per-seller impact */}
            {whatIfResult && whatIfResult.sellerImpacts.length > 0 && (
              <div className="proj-card">
                <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700' }}>Impacto por Seller Estrella</h4>
                {whatIfResult.sellerImpacts.map(impact => {
                  const sellerConfig = sellers.find(s => s.id === impact.sellerId)?.config;
                  return (
                    <div key={impact.sellerId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: sellerConfig?.brandColor || '#3b82f6' }} />
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px' }}>{impact.sellerName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Score: {impact.score}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '24px', textAlign: 'right' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#10b981' }}>+{fmt(impact.extraGmv)}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>GMV Extra</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#06b6d4' }}>+{fmt(impact.extraRevenue)}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>Revenue</div>
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{fmt(impact.newProjectedGmv)}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>Nuevo Proyectado</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {whatIfResult && whatIfResult.sellerImpacts.length === 0 && (
              <div className="proj-card" style={{ textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>Sin sellers estrella</div>
                <div style={{ fontSize: '13px' }}>Ningun seller tiene un Opportunity Score mayor a 80. Revisa las acciones sugeridas en la pestana Sellers.</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════ SELLER DETAIL MODAL ═══════════════════ */}
      {selected && (
        <>
          <div className="detail-overlay" onClick={() => setSelectedSeller(null)} />
          <div className="detail-modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px' }}>{selected.config.shortName}</h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{selected.config.category} &middot; Take Rate: {(selected.config.takeRate * 100)}%</div>
              </div>
              <button onClick={() => setSelectedSeller(null)} style={{ background: '#334155', border: 'none', color: '#e2e8f0', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>X</button>
            </div>

            {/* Score Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px', padding: '16px', background: `${selected.opportunityScore.badge.color}10`, borderRadius: '12px' }}>
              <div style={{ fontSize: '48px', fontWeight: '800', color: selected.opportunityScore.badge.color }}>{selected.opportunityScore.score}</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: selected.opportunityScore.badge.color }}>{selected.opportunityScore.badge.label}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>{selected.opportunityScore.badge.action}</div>
            </div>

            {/* Score Breakdown */}
            <div className="proj-card" style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: '#94a3b8', textTransform: 'uppercase' }}>Desglose del Score</div>
              {Object.entries(selected.opportunityScore.details).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ color: '#94a3b8' }}>{key}</span>
                  <span style={{ fontWeight: '600', color: key.includes('Penalty') || key.includes('penalty') ? '#ef4444' : '#e2e8f0' }}>{typeof val === 'number' ? (key.includes('multiplier') ? `x${val}` : val) : val}</span>
                </div>
              ))}
            </div>

            {/* Run Rate Detail */}
            <div className="proj-card" style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Run Rate & Sprint</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'GMV Actual', value: fmt(selected.runRate?.currentGmv || 0), color: '#3b82f6' },
                  { label: 'Proyectado', value: fmt(selected.runRate?.projectedGmv || 0), color: '#8b5cf6' },
                  { label: 'Target', value: fmt(selected.runRate?.target || 0), color: '#f59e0b' },
                  { label: 'Gap', value: fmt(selected.runRate?.gap || 0), color: '#ef4444' },
                  { label: 'Promedio Diario', value: fmt(selected.runRate?.currentDailyRate || 0), color: '#06b6d4' },
                  { label: 'Diario Necesario', value: fmt(selected.runRate?.dailyTargetRemaining || 0), color: selected.runRate?.onTrack ? '#10b981' : '#ef4444' },
                  { label: 'Ordenes', value: (selected.runRate?.orders || 0).toLocaleString(), color: '#e2e8f0' },
                  { label: 'Cancelaciones', value: `${selected.runRate?.cancelledOrders || 0} (${pct(selected.runRate?.cancelRate || 0)})`, color: '#ef4444' },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>{m.label}</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profitability */}
            <div className="proj-card" style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Rentabilidad (Revenue vs GMV)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Revenue Actual</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#06b6d4' }}>{fmt(selected.profitability?.currentRevenue || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Revenue Proyectado</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>{fmt(selected.profitability?.projectedRevenue || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Target Revenue</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>{fmt(selected.profitability?.targetRevenue || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Take Rate</div>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{selected.profitability?.takeRatePercent || 0}%</div>
                </div>
              </div>
            </div>

            {/* Historical Trend (mini) */}
            {selected.history && (
              <div className="proj-card">
                <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Historico GMV (Ultimos 7 meses)</div>
                {Object.entries(selected.history).sort().map(([month, d]) => {
                  const maxGmv = Math.max(...Object.values(selected.history).map(h => h.gmv));
                  const barWidth = maxGmv > 0 ? (d.gmv / maxGmv) * 100 : 0;
                  return (
                    <div key={month} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', width: '55px', flexShrink: 0 }}>{month}</span>
                      <div style={{ flex: 1, height: '16px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${barWidth}%`, background: selected.config.brandColor, borderRadius: '4px' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', width: '65px', textAlign: 'right' }}>{fmt(d.gmv)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
