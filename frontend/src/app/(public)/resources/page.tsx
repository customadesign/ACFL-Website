"use client";
import Footer from "@/components/Footer";
import NavbarLandingPage from "@/components/NavbarLandingPage";
import Contact from "../component/contactUs";
import Testimonial from "../component/testimonial";
import imgone from "../images/BlogImg1.jpg";
import imgtwo from "../images/HomeImg1.png";
import imgthree from "../images/HomeImg2.png";
import imgfour from "../images/HomeImg4.png";
import imgfive from "../images/HomeImg3.png";
import { motion } from "framer-motion";

import React from "react";
import { Share2, Linkedin, X, Facebook, Link2, ArrowRight, ChevronDown } from "lucide-react";

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>
      {/* Hero Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-[#e9f6f7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 text-sm text-gray-600 mb-8"
          >
            <a href="#" className="hover:text-gray-900">
              Blog
            </a>
            <span>›</span>
            <a href="#" className="hover:text-gray-900">
              Resources
            </a>
          </motion.nav>

          {/* Article Header */}
          <article>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl font-bold text-gray-900 mb-8 leading-tight"
            >
              Navigating life with
              <br />
              acceptance and
              <br />
              commitment
            </motion.h1>

            {/* Author and Meta Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center justify-between mb-12"
            >
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
                  <p className="text-sm font-medium text-gray-900">
                    Dr. Rachel Thompson
                  </p>
                  <p className="text-sm text-gray-600">
                    15 Mar 2024 • 5 min read
                  </p>
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
                  <svg
                    className="w-5 h-5 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
              </div>
            </motion.div>

            {/* Featured Image Placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-12"
            >
              <img
                src={imgone.src}
                alt=""
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </motion.div>

            {/* Article Content would go here */}
          </article>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-white">
        {" "}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">
              Insights
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Latest ACT resources and guides
            </h1>
            <p className="text-gray-600 text-lg">
              Discover transformative strategies for personal and professional growth
            </p>
          </motion.div>

         {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Matching */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white border border-gray-200 overflow-hidden"
            >
              {/* Image */}
              <div className="h-48 overflow-hidden">
                <img
                  src={imgtwo.src}
                  alt="Understanding your values"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-gray-600 font-medium">Wellness</span>
                  <span className="text-xs text-gray-400">5 min read</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Understanding your values in challenging times
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  Learn practical techniques to align your actions with core personal values
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Read more
                  <ArrowRight size={16} className="ml-2" />
                </a>
              </div>
            </motion.div>

            {/* Card 2: Flexible */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white border border-gray-200 overflow-hidden"
            >
              {/* Image */}
              <div className="h-48 overflow-hidden">
                <img
                  src={imgthree.src}
                  alt="Breaking through mental barriers"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-gray-600 font-medium">Mindfulness</span>
                  <span className="text-xs text-gray-400">5 min read</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Breaking through mental barriers
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  Explore strategies to overcome limiting beliefs and create meaningful change
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Read more <ArrowRight size={16} className="ml-2" />
                </a>
              </div>
            </motion.div>

            {/* Card 3: Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white border border-gray-200 overflow-hidden"
            >
              {/* Image */}
              <div className="h-48 overflow-hidden">
                <img
                  src={imgfive.src}
                  alt="Emotional intelligence in the workplace"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-gray-600 font-medium">Leadership</span>
                  <span className="text-xs text-gray-400">5 min read</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Emotional intelligence in the workplace
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  Develop critical skills for effective communication and team performance
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Read more <ArrowRight size={16} className="ml-2" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <a
              href="#"
              className="inline-block px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              View all
            </a>
          </motion.div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">
            Resources
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ACT insights and strategies
          </h1>
          <p className="text-gray-600 text-lg">
            Empowering knowledge for personal and professional development
          </p>
        </motion.div>

        {/* Filter Dropdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative inline-block w-64">
            <select className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400">
              <option>All posts</option>
              <option>Wellness</option>
              <option>Mindfulness</option>
              <option>Leadership</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </motion.div>

        {/* Cards List */}
        <div className="space-y-6">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white border border-gray-200 flex flex-col sm:flex-row overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
              <img
                src={imgtwo.src}
                alt="Understanding your values"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-600 font-medium">Wellness</span>
                <span className="text-xs text-gray-400">5 min read</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Understanding your values in challenging times
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Practical techniques to align actions with core personal values
              </p>
              <a
                href="#"
                className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Read more
                <ArrowRight size={16} className="ml-2" />
              </a>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white border border-gray-200 flex flex-col sm:flex-row overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
              <img
                src={imgthree.src}
                alt="Breaking through mental barriers"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-600 font-medium">Mindfulness</span>
                <span className="text-xs text-gray-400">5 min read</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Breaking through mental barriers
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Explore strategies to overcome limiting beliefs and create meaningful change
              </p>
              <a
                href="#"
                className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Read more
                <ArrowRight size={16} className="ml-2" />
              </a>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white border border-gray-200 flex flex-col sm:flex-row overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
              <img
                src={imgfive.src}
                alt="Emotional intelligence in the workplace"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-600 font-medium">Leadership</span>
                <span className="text-xs text-gray-400">5 min read</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                Emotional intelligence in the workplace
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Develop critical skills for effective communication and team performance
              </p>
              <a
                href="#"
                className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Read more
                <ArrowRight size={16} className="ml-2" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    <section className="py-12 md:py-16 lg:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">
            Library
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Complete ACT resource collection
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive materials for personal and professional transformation
          </p>
        </motion.div>

        {/* Cards Grid - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white flex overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <div className="w-40 flex-shrink-0 overflow-hidden">
              <img
                src={imgtwo.src}
                alt="Navigating stress in modern life"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-700 font-semibold">Wellness</span>
                <span className="text-xs text-gray-500">5 min read</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Navigating stress in modern life
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Practical strategies for managing anxiety and building resilience
              </p>
              <a
                href="#"
                className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Read more
                <ArrowRight size={14} className="ml-2" />
              </a>
            </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white flex overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <div className="w-40 flex-shrink-0 overflow-hidden">
              <img
                src={imgthree.src}
                alt="Building effective communication skills"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-700 font-semibold">Leadership</span>
                <span className="text-xs text-gray-500">5 min read</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Building effective communication skills
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Techniques for improving interpersonal relationships and team dynamics
              </p>
              <a
                href="#"
                className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Read more
                <ArrowRight size={14} className="ml-2" />
              </a>
            </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white flex overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <div className="w-40 flex-shrink-0 overflow-hidden">
              <img
                src={imgfive.src}
                alt="Developing emotional awareness"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-700 font-semibold">Mindfulness</span>
                <span className="text-xs text-gray-500">5 min read</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Developing emotional awareness
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Deep insights into understanding and managing personal emotions
              </p>
              <a
                href="#"
                className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Read more
                <ArrowRight size={14} className="ml-2" />
              </a>
            </div>
          </motion.div>

          {/* Card 4 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white  flex overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Image */}
            <div className="w-40 flex-shrink-0 overflow-hidden">
              <img
                src={imgone.src}
                alt="Setting meaningful life goals"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            <div className="p-6 flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-gray-700 font-semibold">Personal growth</span>
                <span className="text-xs text-gray-500">5 min read</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Setting meaningful life goals
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Strategies for creating purpose-driven personal and professional objectives
              </p>
              <a
                href="#"
                className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Read more
                <ArrowRight size={14} className="ml-2" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center"
        >
          <a
            href="#"
            className="inline-block px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            View all
          </a>
        </motion.div>
      </div>
    </section>

      <Testimonial />
      <section className="bg-white min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-center gap-4"
          >
            <div className="flex flex-col gap-4 text-center mb-16">
              <h1 className="text-4xl">Get insights that transform</h1>
              <p>
                Stay updated with the latest ACT strategies and personal growth
                resources
              </p>
              <div className="flex justify-center gap-4">
                <button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                  Subscribe
                </button>
                <button className="border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-6 py-3 font-medium transition-all shadow-sm">
                  Explore
                </button>
              </div>
            </div>
          </motion.div>
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
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
