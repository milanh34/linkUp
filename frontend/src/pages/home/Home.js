import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Users,
  Shield,
  Camera,
  Activity,
  Globe,
  Clock,
  Gift,
  ArrowRight,
  X,
} from "lucide-react";
import FloatingParticles from "../../components/FloatingParticles";
import { Link } from "react-router-dom";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full relative">
        <button 
          onClick={onClose}
          className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleFakeButton = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowModal(true);
    }, 3000);
  };

  // Rest of your features array remains the same
  const features = [
    {
      icon: <MessageCircle className="w-12 h-12 text-blue-500" />,
      title: "Instant Messaging",
      description: "Messages so fast, they might arrive before you send them. We're still working on fixing that time paradox.",
    },
    {
      icon: <Users className="w-12 h-12 text-green-500" />,
      title: "Group Channels",
      description: "Create channels for your team, your friends, or your multiple personalities. We don't judge.",
    },
    {
      icon: <Shield className="w-12 h-12 text-purple-500" />,
      title: "End-to-End Encryption",
      description: "So secure, even we can't read your messages. Actually, sometimes we can't even deliver them. That's a feature, not a bug.",
    },
    {
      icon: <Camera className="w-12 h-12 text-pink-500" />,
      title: "Rich Media Sharing",
      description: "Share photos, videos, and audio in real-time. Warning: May occasionally turn your selfies into abstract art.",
    },
    {
      icon: <Activity className="w-12 h-12 text-red-500" />,
      title: "Real-time Updates",
      description: "Watch your friends type, delete, retype, and overthink their messages in real-time. Pure entertainment.",
    },
    {
      icon: <Globe className="w-12 h-12 text-orange-500" />,
      title: "Global Reach",
      description: "Connect with users worldwide. May or may not include connections from parallel universes.",
    },
    {
      icon: <Clock className="w-12 h-12 text-indigo-500" />,
      title: "24/7 Availability",
      description: "Online all day, every day. Except when we're not. Which is rare. Usually. Sometimes.",
    },
    {
      icon: <Gift className="w-12 h-12 text-teal-500" />,
      title: "Mystery Feature",
      description: "We haven't decided what to put here yet. But since you're special, maybe you can find out what we're hiding.",
      isLink: true
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 overflow-x-hidden relative">
      <div className="absolute top-16 left-0 right-0 bg-yellow-400 p-2 text-center text-gray-800">
        🎉 Congratulations! You're one of the chosen few to witness our beautiful mess. 
        Yes, we're calling our bugs "features in disguise". 🎉
      </div>
      <FloatingParticles />
      <header className="container mx-auto px-4 py-32 text-center relative">
        <div className="space-y-2 mb-8">
          <div className="text-sm text-purple-600 font-semibold">EXCLUSIVE BETA ACCESS</div>
          <div className="text-xs text-gray-500">(Because you're special... or just lucky, we need testers)</div>
        </div>
        <h1 className="text-6xl font-extrabold text-gray-900 leading-tight">
          Connect. Collaborate. Crash Occasionally.
        </h1>
        <p className="text-xl text-gray-600 mt-4">
          The almost-finished platform for mostly-reliable real-time communication
        </p>
        <div className="text-sm text-gray-500 mt-2">
          (60% of the time, it works every time!)
        </div>
        <button
          onClick={handleFakeButton}
          className="bg-blue-600 text-white px-8 py-3 mt-8 rounded-full 
          hover:bg-blue-700 transition transform hover:scale-105 relative"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Loading...
            </div>
          ) : (
            <div className="flex items-center">
              Be Our Guinea Pig <ArrowRight className="ml-2" />
            </div>
          )}
        </button>
      </header>

      {/* Features section remains the same */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Features That (Usually) Work
        </h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            feature.isLink ? (
              <Link to="/social" key={index}>
                <div
                  className={`bg-white rounded-xl p-6 shadow-lg transition-all transform hover:scale-105 cursor-pointer
                  ${activeFeature === index ? "border-2 border-blue-300" : ""}`}
                  onMouseEnter={() => setActiveFeature(index)}
                  onMouseLeave={() => setActiveFeature(null)}
                >
                  <div className="flex items-center mb-4">
                    {feature.icon}
                    <h3 className="ml-4 text-xl font-semibold text-gray-800">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </Link>
            ) : (
              <div
                key={index}
                className={`bg-white rounded-xl p-6 shadow-lg transition-all transform hover:scale-105 
                ${activeFeature === index ? "border-2 border-blue-300" : ""}`}
                onMouseEnter={() => setActiveFeature(index)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                <div className="flex items-center mb-4">
                  {feature.icon}
                  <h3 className="ml-4 text-xl font-semibold text-gray-800">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          ))}
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 LinkUp. All rights reserved. And all bugs too.</p>
          <p className="text-sm mt-2 text-gray-400">
            Currently in beta. If something breaks, just pretend it's a feature.
          </p>
        </div>
      </footer>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6 text-center space-y-4">
          <iframe
            className="w-full aspect-video"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
            allow="autoplay"
            title="Rickroll"
          />
          <div className="space-y-2">
            <p className="font-semibold text-lg">Congratulations! 🎉</p>
            <p>You just wasted 10 seconds of your life trying to get into our beta.</p>
            <p className="text-sm text-gray-500">Pro tip: Maybe try clicking the Mystery Feature instead? Just saying... 😏</p>
          </div>
          <button 
            onClick={() => setShowModal(false)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
          >
            I deserve this
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default LandingPage;