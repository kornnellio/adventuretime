"use client";

import { Container } from "@/components/ui/container";
import Link from "next/link";
import { useState } from "react";

export default function GDPRRequestPage() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !consent) {
      setSubmitStatus({
        success: false,
        message: "Please provide your email and consent to process your request."
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus({});
      
      const response = await fetch("/api/gdpr-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          success: true,
          message: data.message || "Your request has been submitted successfully."
        });
        setEmail("");
        setConsent(false);
      } else {
        setSubmitStatus({
          success: false,
          message: data.error || "There was a problem submitting your request."
        });
      }
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: "An error occurred. Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-10">
      <div className="prose prose-lg max-w-none text-white">
        <h1 className="text-4xl font-bold mb-6 text-white">GDPR – Request personal data</h1>
        
        <nav className="flex items-center gap-2 text-sm mb-8">
          <Link href="/" className="text-blue-300 hover:text-blue-100">
            Acasa
          </Link>
          <span>&gt;</span>
          <span>GDPR – Request personal data</span>
        </nav>
        
        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          {submitStatus.success ? (
            <div className="bg-green-900/30 border border-green-700 p-4 rounded-md text-white">
              <p>{submitStatus.message}</p>
              <button 
                onClick={() => setSubmitStatus({})} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                  Email:
                </label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="consent"
                    name="consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    className="h-4 w-4 accent-blue-500 bg-gray-800 border-gray-700 rounded"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="consent" className="text-white text-sm">
                    I consent to having AdventureTime collect my email so that they can send me my requested info. For more info check our{" "}
                    <Link href="/politica-de-confidentialitate" className="text-blue-300 hover:text-blue-100">
                      privacy policy
                    </Link>{" "}
                    where you'll get more info on where, how and why we store your data.
                  </label>
                </div>
              </div>
              
              {submitStatus.message && !submitStatus.success && (
                <div className="bg-red-900/30 border border-red-700 p-3 rounded-md text-white text-sm">
                  {submitStatus.message}
                </div>
              )}
              
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="mt-8">
          <p className="text-white">
            In accordance with GDPR regulations, you have the right to request access to your personal data that we have collected.
            Upon submitting this form, we will process your request and send the requested information to the provided email address within 30 days.
          </p>
          <p className="text-white">
            If you have any questions regarding your data or the GDPR process, please contact us at{" "}
            <a href="mailto:office@adventuretime.ro" className="text-blue-300 hover:text-blue-100">
              office@adventuretime.ro
            </a>
          </p>
        </div>
      </div>
    </Container>
  );
} 