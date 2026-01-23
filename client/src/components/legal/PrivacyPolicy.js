import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

function PrivacyPolicy() {
    return (
        <div className="legal-page-container">
            <div className="legal-content">
                <h1>Privacy Policy</h1>
                <p className="last-updated">Last Updated: January 18, 2025</p>

                <section>
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to Elysium. We respect your privacy and are committed to protecting
                        your personal information. This Privacy Policy explains how we collect, use,
                        disclose, and safeguard your information when you use our Service.
                    </p>
                    <p>
                        <strong>Important:</strong> By using Elysium, you consent to the practices
                        described in this Privacy Policy.
                    </p>
                </section>

                <section>
                    <h2>2. Information We Collect</h2>

                    <h3>2.1 Information You Provide</h3>
                    <p>We collect information that you voluntarily provide to us:</p>
                    <ul>
                        <li><strong>Account Information:</strong> Username, email address, password (encrypted)</li>
                        <li><strong>Profile Information:</strong> Display name, bio, profile picture</li>
                        <li><strong>Reading Data:</strong> Books in your libraries, ratings, reviews, reading progress, reading goals</li>
                        <li><strong>Social Data:</strong> Friend connections, activity preferences, privacy settings</li>
                        <li><strong>User-Generated Content:</strong> Reviews, comments, lists, custom book entries</li>
                    </ul>

                    <h3>2.2 Information Collected Automatically</h3>
                    <p>When you use our Service, we automatically collect:</p>
                    <ul>
                        <li><strong>Usage Data:</strong> Pages viewed, features used, time spent on the Service</li>
                        <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                        <li><strong>Log Data:</strong> Access times, error logs, referral URLs</li>
                    </ul>

                    <h3>2.3 Information from Third Parties</h3>
                    <ul>
                        <li><strong>Book Data:</strong> We obtain book information from Open Library and from users</li>
                        <li><strong>Image Hosting:</strong> Profile pictures and book covers are stored on Amazon Web Services (AWS S3)</li>
                    </ul>
                </section>

                <section>
                    <h2>3. How We Use Your Information</h2>
                    <p>We use your information for the following purposes:</p>

                    <h3>3.1 Provide and Improve Services</h3>
                    <ul>
                        <li>Create and manage your account</li>
                        <li>Track your reading progress and goals</li>
                        <li>Display your profile and activity to other users (based on your privacy settings)</li>
                        <li>Recommend books and connect you with other readers</li>
                        <li>Improve our features and user experience</li>
                    </ul>

                    <h3>3.2 Communication</h3>
                    <ul>
                        <li>Respond to your inquiries and support requests</li>
                    </ul>

                    <h3>3.3 Security and Legal Compliance</h3>
                    <ul>
                        <li>Protect against fraud and abuse</li>
                        <li>Enforce our Terms of Service</li>
                        <li>Comply with legal obligations</li>
                    </ul>
                </section>

                <section>
                    <h2>4. How We Share Your Information</h2>

                    <h3>4.1 Public Information</h3>
                    <p>The following information is public by default:</p>
                    <ul>
                        <li>Your username and display name</li>
                        <li>Your profile picture and bio</li>
                        <li>Your public reviews and ratings</li>
                        <li>Your reading activity (if you have a public profile)</li>
                    </ul>
                    <p>You can make your profile private in your account settings.</p>

                    <h3>4.2 With Other Users</h3>
                    <ul>
                        <li>Friends can see your reading activity, reviews, and library</li>
                        <li>Your reviews and ratings are visible to all users unless marked private</li>
                    </ul>

                    <h3>4.3 Service Providers</h3>
                    <p>We share information with third-party service providers who help us operate:</p>
                    <ul>
                        <li><strong>AWS S3:</strong> Image storage and hosting</li>
                        <li><strong>MongoDB Atlas:</strong> Database hosting</li>
                        <li><strong>Vercel/Render:</strong> Application hosting</li>
                    </ul>
                    <p>These providers are contractually obligated to protect your information.</p>

                    <h3>4.4 Legal Requirements</h3>
                    <p>We may disclose your information if required by law or to:</p>
                    <ul>
                        <li>Comply with legal process (e.g., subpoenas, court orders)</li>
                        <li>Protect our rights and property</li>
                        <li>Prevent fraud or illegal activity</li>
                        <li>Protect the safety of users or the public</li>
                    </ul>

                    <h3>4.5 Business Transfers</h3>
                    <p>
                        If Elysium is involved in a merger, acquisition, or sale of assets, your
                        information may be transferred as part of that transaction.
                    </p>

                    <h3>4.6 With Your Consent</h3>
                    <p>We may share your information in other situations with your explicit consent.</p>
                </section>

                <section>
                    <h2>5. Your Privacy Controls</h2>

                    <h3>5.1 Profile Privacy</h3>
                    <p>You can control who sees your information:</p>
                    <ul>
                        <li><strong>Public Profile:</strong> Anyone can see your activity and library</li>
                        <li><strong>Private Profile:</strong> Only friends can see your activity</li>
                    </ul>

                    <h3>5.2 Review Privacy</h3>
                    <ul>
                        <li>Mark individual reviews as containing spoilers</li>
                        <li>Edit or delete your reviews at any time</li>
                    </ul>

                    <h3>5.3 Activity Sharing</h3>
                    <p>Control what activities are shared:</p>
                    <ul>
                        <li>Adding books to libraries</li>
                        <li>Rating and reviewing books</li>
                        <li>Completing reading goals</li>
                    </ul>
                </section>

                <section>
                    <h2>6. Your Rights (California Residents - CCPA)</h2>
                    <p>If you are a California resident, you have the following rights:</p>

                    <h3>6.1 Right to Know</h3>
                    <p>
                        You have the right to request what personal information we collect, use,
                        disclose, and sell (we do not sell your information).
                    </p>

                    <h3>6.2 Right to Delete</h3>
                    <p>
                        You have the right to request deletion of your personal information,
                        subject to certain exceptions.
                    </p>

                    <h3>6.3 Right to Opt-Out</h3>
                    <p>
                        You have the right to opt out of the sale of your personal information.
                        We do not sell your information.
                    </p>

                    <h3>6.4 Right to Non-Discrimination</h3>
                    <p>
                        We will not discriminate against you for exercising your privacy rights.
                    </p>

                    <h3>6.5 How to Exercise Your Rights</h3>
                    <p>
                        To exercise these rights, email us at{' '}
                        <a href="mailto:elysiumbookshelp@gmail.com">elysiumbookshelp@gmail.com</a>. We will
                        respond within 45 days.
                    </p>
                </section>

                <section>
                    <h2>7. Data Security</h2>
                    <p>We implement security measures to protect your information:</p>
                    <ul>
                        <li>Passwords are encrypted using industry-standard hashing (bcrypt)</li>
                        <li>Data transmission is secured with HTTPS/SSL encryption</li>
                        <li>Access to your data is restricted to authorized personnel</li>
                        <li>Regular security audits and updates</li>
                    </ul>
                    <p>
                        However, no system is 100% secure. You are responsible for keeping your
                        password confidential.
                    </p>
                </section>

                <section>
                    <h2>8. Data Retention</h2>
                    <p>We retain your information for as long as:</p>
                    <ul>
                        <li>Your account is active</li>
                        <li>Needed to provide you with services</li>
                        <li>Required by law or legitimate business purposes</li>
                    </ul>
                    <p>
                        When you delete your account, your personal information will be removed from
                        our active databases, but may remain in backups for a limited time.
                    </p>
                </section>

                <section>
                    <h2>9. Children's Privacy</h2>
                    <p>
                        Elysium is not intended for children under 13. We do not knowingly collect
                        information from children under 13. If we learn that we have collected
                        information from a child under 13, we will delete it immediately.
                    </p>
                    <p>
                        If you are a parent or guardian and believe your child has provided us with
                        personal information, please contact us.
                    </p>
                </section>

                <section>
                    <h2>10. International Users</h2>
                    <p>
                        Elysium is operated in the United States. If you access our Service from
                        outside the US, your information will be transferred to, stored, and processed
                        in the United States. By using our Service, you consent to this transfer.
                    </p>
                </section>

                <section>
                    <h2>11. Cookies and Tracking</h2>
                    <p>We use the following technologies:</p>

                    <h3>11.1 Essential Cookies</h3>
                    <ul>
                        <li>Authentication tokens to keep you logged in</li>
                        <li>Session management</li>
                    </ul>

                    <h3>11.2 Analytics</h3>
                    <p>
                        We may use analytics tools to understand how users interact with our Service.
                        These tools may use cookies to collect usage data.
                    </p>

                    <h3>11.3 Your Choices</h3>
                    <p>
                        You can control cookies through your browser settings. However, disabling
                        cookies may limit your ability to use certain features.
                    </p>
                </section>

                <section>
                    <h2>12. Third-Party Links</h2>
                    <p>
                        Our Service may contain links to third-party websites (e.g., book purchase links,
                        author websites). We are not responsible for the privacy practices of these sites.
                        We encourage you to review their privacy policies.
                    </p>
                </section>

                <section>
                    <h2>13. Changes to This Privacy Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of
                        significant changes by:
                    </p>
                    <ul>
                        <li>Posting a notice on our Service</li>
                        <li>Sending an email to your registered email address</li>
                        <li>Updating the "Last Updated" date at the top of this policy</li>
                    </ul>
                    <p>
                        Your continued use of the Service after changes constitutes acceptance of
                        the updated Privacy Policy.
                    </p>
                </section>

                <section>
                    <h2>14. Contact Us</h2>
                    <p>
                        If you have questions, concerns, or requests regarding this Privacy Policy
                        or your personal information, please contact us:
                    </p>
                    <p>
                        <strong>Email:</strong> <a href="mailto:elysiumbookshelp@gmail.com">elysiumbookshelp@gmail.com</a><br />
                        <strong>For CCPA requests:</strong> <a href="mailto:elysiumbookshelp@gmail.com">elysiumbookshelp@gmail.com</a>
                    </p>
                </section>

                <div className="back-link">
                    <Link to="/">← Back to Home</Link>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy;