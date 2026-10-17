
import { Link } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import "../css/LandingPage.css";

function LandingPage() {
    return (
        <div className="landing-page">
            <PublicNavbar />

            {/* Hero section */}
            <main>
                <section className="landing-hero" id="home">
                    <div className="landing-hero-content">
                        <span className="landing-label">
                            INJIBARA UNIVERSITY
                        </span>

                        <h1>
                            Your Future.
                            <br />
                            Your Knowledge.
                            <br />
                            <span>Your Success.</span>
                        </h1>

                        <p>
                            Welcome to the INJIBARA UNIVERSITY Online Examination
                            System. Take your assigned examinations, manage
                            your exam activities, and access your results
                            through one secure platform.
                        </p>

                        <div className="landing-hero-actions">
                            <Link
                                to="/login"
                                className="landing-primary-button"
                            >
                                Login to Your Account
                            </Link>

                            <a
                                href="#about"
                                className="landing-secondary-button"
                            >
                                Learn About Us
                            </a>
                        </div>

                        <div className="landing-trust-note">
                            <span className="landing-status-dot"></span>
                            A centralized examination platform for INJIBARA UNIVERSITY
                        </div>
                    </div>

                    <div className="landing-hero-visual">
                        <div className="landing-visual-decoration landing-decoration-one"></div>
                        <div className="landing-visual-decoration landing-decoration-two"></div>

                        <div className="landing-exam-card">
                            <div className="landing-card-top">
                                <div>
                                    <span className="landing-card-eyebrow">
                               INJIBARA UNIVERSITY
                                    </span>
                                    <h2>Online Examination</h2>
                                </div>

                                <span className="landing-card-icon">✓</span>
                            </div>

                            <div className="landing-card-divider"></div>

                            <div className="landing-card-progress-label">
                                <span>Exam preparation</span>
                                <span>Ready to begin</span>
                            </div>

                            <div className="landing-progress-track">
                                <div className="landing-progress-value"></div>
                            </div>

                            <div className="landing-check-row">
                                <span className="landing-check-icon">✓</span>
                                <span>Secure account access</span>
                            </div>

                            <div className="landing-check-row">
                                <span className="landing-check-icon">✓</span>
                                <span>Assigned examinations</span>
                            </div>

                            <div className="landing-check-row">
                                <span className="landing-check-icon">✓</span>
                                <span>Exam results access</span>
                            </div>

                            <Link
                                to="/login"
                                className="landing-card-button"
                            >
                                Access Examination Portal →
                            </Link>
                        </div>

                        <div className="landing-floating-note">
                            <span className="landing-floating-icon">✦</span>
                            <div>
                                <strong>Learn. Prepare. Succeed.</strong>
                                <small>Your academic journey matters.</small>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature section */}
                <section className="landing-features">
                    <div className="landing-section-heading">
                        <span className="landing-label">OUR PLATFORM</span>
                        <h2>Examinations made organized</h2>
                        <p>
                            A unified platform supporting the examination
                            process for students and authorized college staff.
                        </p>
                    </div>

                    <div className="landing-feature-grid">
                        <article className="landing-feature-card">
                            <div className="landing-feature-icon">
                                <span>01</span>
                            </div>
                            <h3>Secure Access</h3>
                            <p>
                                Sign in using your college account to access
                                the features authorized for your role.
                            </p>
                        </article>

                        <article className="landing-feature-card">
                            <div className="landing-feature-icon">
                                <span>02</span>
                            </div>
                            <h3>Online Examinations</h3>
                            <p>
                                Access examinations assigned to you and
                                complete them through the online system.
                            </p>
                        </article>

                        <article className="landing-feature-card">
                            <div className="landing-feature-icon">
                                <span>03</span>
                            </div>
                            <h3>Results Access</h3>
                            <p>
                                View your examination results when they are
                                available through your student account.
                            </p>
                        </article>
                    </div>
                </section>

                {/* About Us section */}
                <section className="landing-about" id="about">
                    <div className="landing-about-mark">FC</div>

                    <div className="landing-about-content">
                        <span className="landing-label">ABOUT US</span>

                        <h2>Welcome to INJIBARA UNIVERSITY</h2>

                        <p>
                            INJIBARA UNIVERSITY provides this online examination
                            platform to support a more organized and
                            accessible examination process. The system
                            connects authorized students and college staff
                            with the examination services they need.
                        </p>

                        <p>
                            Our platform brings examination access and
                            results into one place while respecting
                            role-based permissions.
                        </p>

                        <Link
                            to="/login"
                            className="landing-primary-button"
                        >
                            Enter the Portal →
                        </Link>
                    </div>
                </section>

                {/* Login call to action */}
                <section className="landing-cta">
                    <div>
                        <span className="landing-label">
                            YOUR NEXT STEP
                        </span>
                        <h2>Ready to access your examination portal?</h2>
                        <p>
                            Sign in with your INJIBARA UNIVERSITY account to
                            continue.
                        </p>
                    </div>

                    <Link to="/login" className="landing-cta-button">
                        Login Now →
                    </Link>
                </section>
            </main>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <div className="landing-footer-brand">
                        <img
                            src="/images/college-logo.png"
                            alt="Future College logo"
                        />
                        <span>INJIBARA UNIVERSITY</span>
                    </div>

                    <p>
                        Online Examination System
                    </p>

                    <span className="landing-footer-copy">
                        © {new Date().getFullYear()} Future College. All rights
                        reserved.
                    </span>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
