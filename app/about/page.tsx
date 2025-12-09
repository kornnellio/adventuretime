'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { 
  Users, 
  Mountain, 
  Award, 
  Heart,
  Facebook,
  Instagram
} from 'lucide-react';
import { Icon } from "@iconify/react";

const stats = [
  { icon: Users, value: '10,000+', label: 'Aventurieri Fericiți' },
  { icon: Mountain, value: '500+', label: 'Trasee Unice' },
  { icon: Award, value: '50+', label: 'Premii Câștigate' },
  { icon: Heart, value: '98%', label: 'Rata de Satisfacție' },
];

const timeline = [
  { year: '2015', title: 'Începutul Călătoriei', description: 'AdventureTime.Ro își începe povestea cu primul grup de aventurieri.' },
  { year: '2017', title: 'Extindere Națională', description: 'Am ajuns să organizăm aventuri în toate colțurile României.' },
  { year: '2020', title: 'Inovație în Pandemie', description: 'Am adaptat experiențele pentru siguranța aventurierilor noștri.' },
  { year: '2021', title: 'Premiul Excellence', description: 'Recunoaștere internațională pentru serviciile noastre.' },
  { year: '2022', title: 'Comunitate 10,000+', description: 'Am atins pragul de 10,000 de aventurieri în comunitatea noastră.' },
  { year: '2023', title: 'Sustenabilitate', description: 'Lansarea programului de turism eco-responsabil.' },
];

const testimonials = [
  {
    name: 'Razvan Puiu',
    role: 'Aventurier Pasionat',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
    text: 'We had an amazing experience with AdventureTime. We had the opportunity to paddle through some areas from the Danube Delta where motor boats could not reach. The nature was incredible and we were in the middle of it. At sunset we had a feast with a local who cooked the best fish soup ever eaten. Cosma is very organized and cares a lot about safety. He taught us everything we needed to know and made sure we enjoyed every moment. As soon as I got home, I signed up for the next round.'
  },
  {
    name: 'Andu Prim',
    role: 'Aventurier',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    text: 'O aventura superba cu niste oameni super misto. Pentru cine vrea sa vada adevarata Delta, asa cum inca mai este in anumite locuri, salbatica si neimblanzita, trebuie sa faca o tura cu AdventureTime.'
  },
  {
    name: 'Raluca Stan',
    role: 'Prima Experiență',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    text: 'Pentru prima experiență pot scrie 100 propoziții de ce ii recomand. Dar cel mai mult ii recomanda pasiunea pe care o au pentru acest sport si altitudinea pozitivă. Recomand cu mare drag ❤'
  },
  {
    name: 'Carmen Mocanu',
    role: 'Caiac Enthusiast',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    text: 'De vis tura cu caiacul. Greut, recunosc, dar nu ma asteptam sa fie altfel. A fost o experienta extraordinara. Mada si Cosma sunt niste super oameni ♡ ... Loved the kayak trip. It was a bit hard, but I didn\'t expect it to be otherwise. It was an extraordinary experience. Mada and Cosma are very cool people ♡'
  },
  {
    name: 'Mihai Patrascu',
    role: 'Aventurier',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    text: '10+ pentru organizare 🙂 tura faina, relaxanta si oameni faini.'
  }
];

const team = [
  {
    name: 'Cosma',
    role: 'Fondator, CEO, Ghid Caiac, Ghid Rafting, Ghid SUP',
    image: '/organizers/cosma.jpg',
    social: {
      facebook: 'https://www.facebook.com/share/1KinEFawEn/?mibextid=wwXIfr',
      instagram: 'https://www.instagram.com/adventuretime.ro?igsh=MWpoZHprbm8zd2Focw%3D%3D&utm_source=qr',
      tiktok: 'https://www.tiktok.com/@adventuretime.ro?_t=ZN-8vd8FU8wxIU&_r=1'
    }
  },
  {
    name: 'Mădălina',
    role: 'Fondator, CEO, Ghid Caiac, Ghid Rafting, Ghid SUP',
    image: '/organizers/madalina.jpg',
    social: {
      facebook: 'https://www.facebook.com/share/1Eww6EsmMy/?mibextid=wwXIfr',
      instagram: 'https://www.instagram.com/braceamadalina?igsh=MzU2eHVvZzU2YWNz',
      tiktok: 'https://www.tiktok.com/@madalina.bracea?_t=ZN-8vd8NbScttu&_r=1'
    }
  },
  {
    name: 'Filip',
    role: 'Fondator, CEO, Ghid Caiac, Ghid Rafting, Ghid SUP',
    image: '/organizers/filip.jpg',
    social: {
      facebook: 'https://www.facebook.com/share/1948Za9GEk/?mibextid=wwXIfr',
      instagram: 'https://www.instagram.com/whoisffilip?igsh=MWJnbXBsbzF4enFkZw%3D%3D&utm_source=qr',
      tiktok: 'https://www.tiktok.com/@whoisffilip?_t=ZN-8vd8HD1VnJ0&_r=1'
    }
  }
];

export default function AboutPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Video Background */}
      <div className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          loop
          muted
          className="absolute w-full h-full object-cover opacity-30"
          style={{ filter: 'brightness(0.4)' }}
        >
          <source src="/videos/adventure-hero.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 text-center px-4">
          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.8 }}
            className="text-6xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent"
          >
            Descoperă Povestea Noastră
          </motion.h1>
          <motion.p 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto"
          >
            Creăm experiențe memorabile pentru aventurierii care caută să descopere frumusețea naturii și bucuria explorării.
          </motion.p>
        </div>
      </div>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card/50 p-8 rounded-2xl border border-border hover:border-orange-500/50 transition-all duration-300"
              >
                <stat.icon className="w-12 h-12 text-orange-500 mb-4" />
                <h3 className="text-3xl font-bold text-white mb-2">{stat.value}</h3>
                <p className="text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            Călătoria Noastră
          </h2>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-orange-500/20"></div>
            
            {/* Timeline Items */}
            <div className="space-y-12">
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{
                    hidden: { opacity: 0, x: index % 2 === 0 ? -50 : 50 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  transition={{ duration: 0.5 }}
                  className={`flex items-center ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-1/2 px-8">
                    <div className={`bg-card/50 p-6 rounded-2xl border border-border ${index % 2 === 0 ? 'text-right' : ''}`}>
                      <span className="text-orange-500 font-bold text-xl">{item.year}</span>
                      <h3 className="text-xl font-bold text-white mt-2">{item.title}</h3>
                      <p className="text-gray-400 mt-2">{item.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full"></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            Ce Spun Aventurierii Noștri
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card/50 p-8 rounded-2xl border border-border hover:border-orange-500/50 transition-all duration-300"
            >
              <p className="text-gray-300 italic mb-4">&quot;{testimonial.text}&quot;</p>
                <div className="mt-4 border-t border-gray-700 pt-4">
                  <h3 className="text-xl font-bold text-white">{testimonial.name}</h3>
                  <p className="text-gray-400">{testimonial.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            Echipa Noastră
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative overflow-hidden rounded-2xl aspect-square w-full mb-6">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{member.name}</h3>
                <p className="text-gray-300 text-sm mb-4">{member.role}</p>
                
                {/* Social Media Icons */}
                <div className="flex space-x-4 mt-2">
                  <a href={member.social.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <Facebook size={20} />
                  </a>
                  <a href={member.social.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <Instagram size={20} />
                  </a>
                  <a href={member.social.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <Icon icon="ri:tiktok-fill" width={20} height={20} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 p-12 rounded-3xl border border-orange-500/20"
          >
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Pregătit pentru Următoarea Aventură?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Alătură-te comunității noastre de aventurieri și descoperă experiențe de neuitat.
            </p>
            <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg shadow-orange-500/20">
              Contactează-ne
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 