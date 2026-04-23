import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import './LandingPage.css';

function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="landing">

      {/* ── Top Nav ─────────────────────────────────────── */}
      <header className="landing-nav">
        <span className="landing-nav-brand">{t('landingNavBrand')}</span>
        <Link to="/login" className="landing-nav-signin">
          {t('landingSignIn')}
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-hero-badge">AI-Powered Academic Planner</div>
          <h1 className="landing-hero-headline">{t('landingHeroHeadline')}</h1>
          <p className="landing-hero-sub">{t('landingHeroSubheadline')}</p>
          <Link to="/login" className="landing-cta-btn">
            {t('landingGetStarted')}
          </Link>
        </div>
        <div className="landing-hero-visual" aria-hidden="true">
          <div className="landing-mockup">
            <div className="landing-mockup-bar">
              <span /><span /><span />
            </div>
            <div className="landing-mockup-body">
              <div className="lm-stat lm-stat--accent" />
              <div className="lm-stat" />
              <div className="lm-stat" />
              <div className="lm-divider" />
              <div className="lm-row"><div className="lm-dot lm-dot--red" /><div className="lm-line lm-line--long" /></div>
              <div className="lm-row"><div className="lm-dot lm-dot--yellow" /><div className="lm-line lm-line--med" /></div>
              <div className="lm-row"><div className="lm-dot lm-dot--green" /><div className="lm-line lm-line--short" /></div>
              <div className="lm-row"><div className="lm-dot lm-dot--green" /><div className="lm-line lm-line--med" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works — Bento Grid ───────────────────── */}
      <section className="landing-how">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">{t('landingHowItWorksTitle')}</h2>
          <p className="landing-section-subtitle">{t('landingHowItWorksSubtitle')}</p>

          <div className="landing-bento">
            {/* Card 1 — Sync */}
            <div className="bento-card bento-card--sync">
              <div className="bento-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
              </div>
              <div className="bento-step">01</div>
              <h3 className="bento-title">{t('landingStep1Title')}</h3>
              <p className="bento-desc">{t('landingStep1Desc')}</p>
              <div className="bento-logos" aria-label="Microsoft and Google">
                <span className="bento-logo bento-logo--ms">M</span>
                <span className="bento-logo bento-logo--g">G</span>
              </div>
            </div>

            {/* Card 2 — Analyze (featured / tall) */}
            <div className="bento-card bento-card--analyze bento-card--featured">
              <div className="bento-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="bento-step">02</div>
              <h3 className="bento-title">{t('landingStep2Title')}</h3>
              <p className="bento-desc">{t('landingStep2Desc')}</p>
              <div className="bento-score-demo" aria-hidden="true">
                <div className="bsd-item">
                  <div className="bsd-bar" style={{ '--w': '90%' }} />
                  <span>Thesis Draft</span>
                  <strong>90</strong>
                </div>
                <div className="bsd-item">
                  <div className="bsd-bar" style={{ '--w': '72%' }} />
                  <span>Lab Report</span>
                  <strong>72</strong>
                </div>
                <div className="bsd-item">
                  <div className="bsd-bar" style={{ '--w': '55%' }} />
                  <span>Reading Quiz</span>
                  <strong>55</strong>
                </div>
              </div>
            </div>

            {/* Card 3 — Focus */}
            <div className="bento-card bento-card--focus">
              <div className="bento-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="bento-step">03</div>
              <h3 className="bento-title">{t('landingStep3Title')}</h3>
              <p className="bento-desc">{t('landingStep3Desc')}</p>
              <div className="bento-checklist" aria-hidden="true">
                <div className="bcl-item bcl-item--done"><span /> Thesis Draft</div>
                <div className="bcl-item"><span /> Lab Report</div>
                <div className="bcl-item"><span /> Reading Quiz</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Global Reach ────────────────────────────────── */}
      <section className="landing-global">
        <div className="landing-section-inner">
          <div className="landing-global-grid">
            <div className="landing-global-text">
              <div className="landing-global-badge">Global &amp; Inclusive</div>
              <h2 className="landing-section-title landing-section-title--light">
                {t('landingGlobalTitle')}
              </h2>
              <p className="landing-global-subtitle">{t('landingGlobalSubtitle')}</p>
              <ul className="landing-global-feats">
                <li>{t('landingGlobalFeat1')}</li>
                <li>{t('landingGlobalFeat2')}</li>
                <li>{t('landingGlobalFeat3')}</li>
              </ul>
            </div>

            <div className="landing-global-stats">
              <div className="lgs-card">
                <span className="lgs-value">42</span>
                <span className="lgs-label">{t('landingGlobalLanguages')}</span>
              </div>
              <div className="lgs-card">
                <span className="lgs-value">↔</span>
                <span className="lgs-label">{t('landingGlobalRTL')}</span>
              </div>
              <div className="lgs-card">
                <span className="lgs-value">∞</span>
                <span className="lgs-label">{t('landingGlobalStudents')}</span>
              </div>
              <div className="landing-global-flags" aria-hidden="true">
                {['🇺🇸','🇪🇸','🇫🇷','🇩🇪','🇮🇳','🇸🇦','🇯🇵','🇰🇷','🇧🇷','🇷🇺','🇨🇳','🇵🇰'].map(f => (
                  <span key={f} className="lgf-flag">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── University Attribution ───────────────────────── */}
      <section className="landing-attribution">
        <div className="landing-attribution-inner">
          <div className="landing-slu-badge">
            <span className="landing-slu-icon" aria-hidden="true">🎓</span>
            <div>
              <div className="landing-slu-title">{t('landingBuiltAt')}</div>
              <div className="landing-slu-desc">{t('landingBuiltAtDesc')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="landing-footer">
        <span className="landing-footer-brand">Planora</span>
        <span className="landing-footer-sep" aria-hidden="true">·</span>
        <span className="landing-footer-copy">
          {t('landingAlreadyHaveAccount')}{' '}
          <Link to="/login" className="landing-footer-link">{t('landingSignIn')}</Link>
        </span>
      </footer>

    </div>
  );
}

export default LandingPage;
