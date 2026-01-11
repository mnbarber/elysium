import React, { useState } from 'react';
import './FAQ.css';

function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = [
        {
            question: "What is Elysium?",
            answer: "Elysium is a social book tracking platform where you can organize your reading habits, discover new books, create custom lists, and connect with other readers."
        },
        {
            question: "How do I add books to my library?",
            answer: "Search for any book using the search bar on the home page, then click the buttons to add it to one of your library shelves (To Read, Currently Reading, Read, Paused, or DNF)."
        },
        {
            question: "Can I add books that aren't in the database?",
            answer: "Yes! If you can't find a book in our search results, you can manually add it by clicking 'Can't find your book? Add it yourself here' on the search page."
        },
        {
            question: "What are book lists?",
            answer: "Book lists are custom collections you can create around any theme (favorite sci-fi, beach reads, etc.). Lists can be private or public, and other users can suggest books for your public lists."
        },
        {
            question: "How do public lists work?",
            answer: "When you make a list public, other users can view it and suggest books to add. You'll receive suggestions in your list dashboard and can choose to accept or reject them."
        },
        {
            question: "How do I find and add friends?",
            answer: "Go to 'Find Users' to search for other readers. Click on their profile to send a friend request. Once accepted, you can see their reading activity in your Friend Feed."
        },
        {
            question: "Can I rate and review books?",
            answer: "Yes! Click on any book in your library to rate it (1-5 stars) and write a review. Your reviews are visible on your profile."
        },
        {
            question: "What is the Friend Feed?",
            answer: "The Friend Feed shows recent reading activity from your friends - books they've added, ratings they've given, and reviews they've written."
        },
        {
            question: "How do I reset my password?",
            answer: "On the login page, click 'Forgot Password?' and enter your email. We'll send you a link to reset your password."
        },
        {
            question: "Can I change my profile picture and bio?",
            answer: "Yes! Go to your profile and click 'Edit Profile' to update your display name, bio, and avatar URL."
        },
        {
            question: "Is Elysium free?",
            answer: "Yes, Elysium is completely free to use!"
        },
        {
            question: "How do I delete my account?",
            answer: "Please contact us using the Contact page and we'll help you delete your account."
        }
    ];

    const toggleFAQ = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="faq-container">
            <h1>? Frequently Asked Questions ?</h1>
            <p className="faq-subtitle">Find answers to common questions about Elysium</p>

            <div className="faq-list">
                {faqs.map((faq, index) => (
                    <div
                        key={index}
                        className={`faq-item ${openIndex === index ? 'open' : ''}`}
                        onClick={() => toggleFAQ(index)}
                    >
                        <div className="faq-question">
                            <h3>{faq.question}</h3>
                            <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
                        </div>
                        {openIndex === index && (
                            <div className="faq-answer">
                                <p>{faq.answer}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="faq-contact">
                <p>Still have questions?</p>
                <a href="/contact" className="btn-contact">Contact Us</a>
            </div>
        </div>
    );
}

export default FAQ;