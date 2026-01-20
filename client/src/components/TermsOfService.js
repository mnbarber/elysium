import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

function TermsOfService() {
    return (
        <div className="legal-page-container">
            <div className="legal-content">
                <h1>Terms of Service</h1>
                <p className="last-updated">Last Updated: January 19, 2025</p>

                <section>
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        Welcome to Elysium! By accessing or using our website and services ("Service"),
                        you agree to be bound by these Terms of Service ("Terms"). If you do not agree
                        to these Terms, please do not use our Service.
                    </p>
                </section>

                <section>
                    <h2>2. Description of Service</h2>
                    <p>
                        Elysium is a book tracking and social reading platform that allows users to:
                    </p>
                    <ul>
                        <li>Track books they want to read, are currently reading, or have read</li>
                        <li>Rate and review books</li>
                        <li>Set reading goals</li>
                        <li>Connect with other readers</li>
                        <li>Share reading activity with friends</li>
                        <li>Discover new books through community recommendations</li>
                    </ul>
                </section>

                <section>
                    <h2>3. User Accounts</h2>
                    <h3>3.1 Account Creation</h3>
                    <p>
                        To use the features of our Service, you must create an account. You agree to:
                    </p>
                    <ul>
                        <li>Provide accurate, current, and complete information</li>
                        <li>Maintain and update your information to keep it accurate</li>
                        <li>Maintain the security of your password</li>
                        <li>Accept all risks of unauthorized access to your account</li>
                        <li>Notify us immediately of any unauthorized use</li>
                    </ul>

                    <h3>3.2 Account Eligibility</h3>
                    <p>
                        You must be at least 13 years old to use Elysium. If you are under 18,
                        you represent that you have your parent or guardian's permission to use the Service.
                    </p>

                    <h3>3.3 Account Termination</h3>
                    <p>
                        We reserve the right to suspend or terminate your account at any time for
                        any reason, including violation of these Terms.
                    </p>
                </section>

                <section>
                    <h2>4. User Content</h2>
                    <h3>4.1 Your Content</h3>
                    <p>
                        You retain all rights to content you post on Elysium, including reviews,
                        ratings, lists, and profile information ("User Content").
                    </p>

                    <h3>4.2 License to Use Your Content</h3>
                    <p>
                        By posting User Content, you grant Elysium a non-exclusive, worldwide,
                        royalty-free license to use, display, reproduce, and distribute your
                        content in connection with the Service.
                    </p>

                    <h3>4.3 Content Standards</h3>
                    <p>You agree that your User Content will not:</p>
                    <ul>
                        <li>Violate any laws or regulations</li>
                        <li>Infringe on intellectual property rights</li>
                        <li>Contain hate speech, harassment, or threats</li>
                        <li>Include spam or unauthorized advertising</li>
                        <li>Contain malware or malicious code</li>
                        <li>Impersonate others or misrepresent your affiliation</li>
                    </ul>

                    <h3>4.4 Content Removal</h3>
                    <p>
                        We reserve the right to remove any User Content that violates these Terms
                        or that we find objectionable, without notice.
                    </p>
                </section>

                <section>
                    <h2>5. Privacy</h2>
                    <p>
                        Your privacy is important to us. Please review our{' '}
                        <Link to="/privacy">Privacy Policy</Link> to understand how we collect,
                        use, and protect your information.
                    </p>
                </section>

                <section>
                    <h2>6. Intellectual Property</h2>
                    <h3>6.1 Our Property</h3>
                    <p>
                        The Service, including its design, code, and content (excluding User Content),
                        is owned by Elysium and protected by copyright, trademark, and other laws.
                    </p>

                    <h3>6.2 Book Data</h3>
                    <p>
                        Book information on Elysium is sourced from Open Library and from our users.
                        Book covers and metadata belong to their respective copyright holders.
                    </p>

                    <h3>6.3 Prohibited Uses</h3>
                    <p>You may not:</p>
                    <ul>
                        <li>Copy, modify, or distribute our code or content</li>
                        <li>Reverse engineer or decompile the Service</li>
                        <li>Use automated tools to scrape or collect data</li>
                        <li>Remove copyright or proprietary notices</li>
                    </ul>
                </section>

                <section>
                    <h2>7. Third-Party Services</h2>
                    <p>
                        Elysium integrates with third-party services including:
                    </p>
                    <ul>
                        <li>Open Library (for book data)</li>
                        <li>AWS S3 (for image hosting)</li>
                    </ul>
                    <p>
                        We are not responsible for the availability, content, or practices of
                        these third-party services.
                    </p>
                </section>

                <section>
                    <h2>8. Disclaimers</h2>
                    <h3>8.1 Service "As Is"</h3>
                    <p>
                        The Service is provided "as is" and "as available" without warranties of
                        any kind.
                    </p>

                    <h3>8.2 No Guarantee</h3>
                    <p>
                        We do not guarantee that the Service will be uninterrupted, secure, or
                        error-free, or that defects will be corrected.
                    </p>

                    <h3>8.3 User Reviews</h3>
                    <p>
                        Reviews and ratings are user-generated opinions. We do not endorse or
                        verify the accuracy of user reviews.
                    </p>
                </section>

                <section>
                    <h2>9. Limitation of Liability</h2>
                    <p>
                        To the fullest extent permitted by law, Elysium and its operators shall
                        not be liable for any indirect, incidental, special, consequential, or
                        punitive damages, or any loss of profits or revenues, whether incurred
                        directly or indirectly, or any loss of data, use, goodwill, or other
                        intangible losses resulting from:
                    </p>
                    <ul>
                        <li>Your use or inability to use the Service</li>
                        <li>Unauthorized access to your account or data</li>
                        <li>Errors or omissions in the Service</li>
                        <li>Any conduct or content of third parties on the Service</li>
                    </ul>
                </section>

                <section>
                    <h2>10. Indemnification</h2>
                    <p>
                        You agree to indemnify and hold harmless Elysium and its operators from
                        any claims, damages, losses, liabilities, and expenses (including legal fees)
                        arising from:
                    </p>
                    <ul>
                        <li>Your violation of these Terms</li>
                        <li>Your User Content</li>
                        <li>Your violation of any rights of another person or entity</li>
                    </ul>
                </section>

                <section>
                    <h2>11. Changes to Terms</h2>
                    <p>
                        We may modify these Terms at any time. We will notify users of significant
                        changes by posting a notice on the Service or sending an email. Your continued
                        use of the Service after changes constitutes acceptance of the modified Terms.
                    </p>
                </section>

                <section>
                    <h2>12. Termination</h2>
                    <p>
                        You may terminate your account at any time through your account settings.
                        We may terminate or suspend your account immediately, without notice, for
                        any violation of these Terms.
                    </p>
                </section>

                <section>
                    <h2>13. Governing Law</h2>
                    <p>
                        These Terms shall be governed by and construed in accordance with the laws
                        of the State of California, United States, without regard to its conflict
                        of law provisions.
                    </p>
                </section>

                <section>
                    <h2>15. Contact Information</h2>
                    <p>
                        If you have questions about these Terms, please contact us at:
                    </p>
                    <p>
                        <strong>Email:</strong> <a href="mailto:elysiumbookshelp@gmail.com">elysiumbookshelp@gmail.com</a>
                    </p>
                </section>

                <div className="back-link">
                    <Link to="/">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}

export default TermsOfService;