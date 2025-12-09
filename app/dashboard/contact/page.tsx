import React from 'react';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - AdventureTime.Ro",
  description: "Intră în legătură cu echipa AdventureTime.Ro",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Contact</h1>
      
      <div className="max-w-2xl mx-auto bg-white/5 p-8 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Intră în legătură cu noi</h2>
            <p className="text-gray-300">
              Ai întrebări sau ai nevoie de asistență? Suntem aici să te ajutăm! Completează formularul de mai jos și te vom contacta cât mai curând posibil.
            </p>
          </div>
          
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Nume</label>
                <input 
                  type="text" 
                  id="name" 
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  placeholder="Numele tău"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  placeholder="email@exemplu.com"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium mb-1">Subiect</label>
              <input 
                type="text" 
                id="subject" 
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="Despre ce este vorba?"
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">Mesaj</label>
              <textarea 
                id="message" 
                rows={5} 
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="Cum te putem ajuta?"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all duration-200"
            >
              Trimite Mesaj
            </button>
          </form>
          
          <div className="pt-6 border-t border-white/10 mt-8">
            <h3 className="text-lg font-medium mb-3">Alte moduri de a ne contacta</h3>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <span className="text-orange-500">E-mail:</span> 
                <a href="mailto:office@adventuretime.ro" className="text-gray-300 hover:text-white transition-colors">office@adventuretime.ro</a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-orange-500">Telefon:</span> 
                <div className="flex flex-col">
                  <a href="tel:0784258058" className="text-gray-300 hover:text-white transition-colors">Cosma: 0784258058</a>
                  <a href="tel:0760187443" className="text-gray-300 hover:text-white transition-colors">Filip: 0760187443</a>
                </div>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-orange-500">Adresa:</span> 
                <span className="text-gray-300">Strada Lecturii, nr 29, sector 2, cartier Andronache, București</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 