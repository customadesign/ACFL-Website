"use client";
import Footer from "@/components/Footer";
import NavbarLandingPage from "@/components/NavbarLandingPage";
import Contact from "../component/contactUs";
import Testimonial from "../component/testimonial";
import imgone from "../images/BlogImg1.jpg";
import imgfour from "../images/HomeImg4.png";

import React from 'react';
import { Share2, Linkedin, X, Facebook, Link2 } from 'lucide-react';


export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>
      {/* Hero Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <a href="#" className="hover:text-gray-900">Blog</a>
          <span>›</span>
          <a href="#" className="hover:text-gray-900">ACT Insights</a>
        </nav>

        {/* Article Header */}
        <article>
          <h1 className="text-5xl font-bold text-gray-900 mb-8 leading-tight">
            Understanding acceptance<br />
            and commitment in<br />
            personal growth
          </h1>

          {/* Author and Meta Info */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop"
                  alt="Sarah Thompson"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sarah Thompson</p>
                <p className="text-sm text-gray-600">15 Mar 2024 • 5 min read</p>
              </div>
            </div>

            {/* Share Icons */}
            <div className="flex items-center gap-3">
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
                <Link2 className="w-5 h-5 text-gray-700" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
                <Linkedin className="w-5 h-5 text-gray-700" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
                <Share2 className="w-5 h-5 text-gray-700" />
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Featured Image Placeholder */}
          <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-12">
             <img
            src={imgone.src}
            alt=""
            className="w-full h-auto object-cover"
            loading="lazy"
          />
          </div>

          {/* Article Content would go here */}
        </article>
      </div>
      </section>

      <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
        {/* Main Content */}
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            Acceptance is a journey, not a destination. In the landscape of personal growth, we often struggle 
            against our inner experiences, believing that fighting will bring peace. But what if true strength lies in 
            embracing our thoughts and feelings, not battling them?
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            Acceptance and Commitment Therapy (ACT) offers a unique approach to mental wellness. It teaches 
            us that pain is an inevitable part of human experience. Our suffering increases when we resist what 
            cannot be changed. Instead, ACT guides us to accept our emotions, thoughts, and circumstances 
            while committing to actions aligned with our core values.
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            Imagine your mind as a vast ocean. Thoughts are waves that come and go. Traditional therapy 
            might teach you to calm the waves. ACT teaches you to become a skilled navigator, riding those 
            waves with purpose and resilience.
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            The core of ACT revolves around six key processes: psychological flexibility, cognitive defusion, 
            acceptance, contact with the present moment, values, and committed action. These aren't just 
            theoretical concepts but practical skills that transform how we engage with life's challenges.
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            Cognitive defusion helps us see thoughts as mental events, not absolute truths. Acceptance allows 
            us to experience emotions without being consumed by them. Connecting with the present moment 
            grounds us in reality, not hypothetical fears or regrets.
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            Values become our compass. They are the deeply held principles that give meaning to our actions. 
            When we align our behaviors with these values, we create a life of purpose and authenticity.
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            Committed action is where theory meets practice. It's about taking meaningful steps towards our 
            goals, even when discomfort or fear tries to hold us back. Small, consistent actions build resilience 
            and create lasting change.
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            Personal growth isn't about eliminating negative experiences. It's about developing the capacity to 
            move forward despite them. ACT empowers individuals to live fully, embracing both joy and 
            challenge with equal courage.
          </p>

          <p className="text-gray-700 leading-relaxed mb-6">
            Remember, healing is not linear. Some days will feel easier than others. The practice of acceptance is 
            itself a form of strength. By learning to be with our experiences rather than fighting them, we open 
            the door to genuine transformation.
          </p>
        </div>

        {/* Share Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium">Share this post</span>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Linkedin className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Facebook className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                Personal growth
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                Mental wellness
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                ACT therapy
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                Psychological flexibility
              </span>
            </div>
          </div>
        </div>

        {/* Author Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop"
                alt="Sarah Thompson"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Sarah Thompson</h3>
              <p className="text-gray-600 text-sm">Lead coach, ACT Coaching for Life</p>
            </div>
          </div>
        </div>
      </article>
      <Testimonial />
      <section className="bg-white min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <div className="flex flex-col gap-4 text-center mb-16">
              <h1 className="text-4xl">Ready to start your journey?</h1>
              <p>
                Discover personalized coaching that helps you live with purpose
                and clarity
              </p>
              <div className="flex justify-center gap-2">
                <button className="bg-[#25a7b8] text-white rounded-md p-2">
                  Start assessment{" "}
                </button>
                <button className="border border-gray-400 rounded-md p-2">
                  Browse resources{" "}
                </button>
              </div>
            </div>
          </div>
          <img
            src={imgfour.src}
            alt=""
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      </section>
      <Contact />
      <Footer />
    </div>
  );
}
