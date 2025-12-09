"use client";

import Link from "next/link";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Icon } from "@iconify/react";
import NTPLogo from "ntp-logo-react";

const socialLinks = [
  {
    icon: Facebook,
    href: "https://www.facebook.com/AdventureTime.ro/",
    label: "Facebook",
  },
  {
    icon: Instagram,
    href: "https://www.instagram.com/adventuretime.ro/",
    label: "Instagram",
  },
  {
    icon: ({
      className,
      ...props
    }: {
      className: string;
      [key: string]: any;
    }) => (
      <Icon
        icon="mdi:youtube"
        className={className}
        {...props}
      />
    ),
    href: "https://www.youtube.com/channel/UCJxJSAckIpb41mvUeYE9bTw",
    label: "YouTube",
  },
  {
    icon: ({
      className,
      ...props
    }: {
      className: string;
      [key: string]: any;
    }) => (
      <Icon
        icon="ri:tiktok-fill"
        className={className}
        {...props}
      />
    ),
    href: "https://www.tiktok.com/@adventuretime.ro?_t=ZN-8vd8FU8wxIU&_r=1",
    label: "TikTok",
  },
];

const contactInfo = {
  email: "office@adventuretime.ro",
  phones: {
    cosma: "0784258058",
    filip: "0760187443"
  },
  address: "Strada Lecturii, nr 29, sector 2, cartier Andronache, București",
};

const legalImages = [
  {
    src: "/legal/anpc.png",
    alt: "ANPC",
    href: "https://anpc.ro/",
    width: 120,
    height: 40,
  },
  {
    src: "/legal/litigii.png",
    alt: "SOL - Solutionarea Online a Litigiilor",
    href: "https://ec.europa.eu/consumers/odr",
    width: 120,
    height: 40,
  },
];

export default function Footer() {
  return (
    <footer className="bg-black border-t mt-auto text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Despre Adventure-Time.ro</h3>
            <p className="text-gray-300 text-sm">
              Destinația ta de încredere pentru aventuri și experiențe de călătorie
              de calitate. Suntem pasionați să facem experiențele de călătorie accesibile
              tuturor.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Link-uri Rapide</h3>
            <nav className="space-y-2">
              <Link
                href="/about"
                className="block text-sm text-gray-300 hover:text-white"
              >
                Despre Noi
              </Link>
              <Link
                href="/contact"
                className="block text-sm text-gray-300 hover:text-white"
              >
                Contact
              </Link>
              <Link
                href="/termeni-si-conditii"
                className="block text-sm text-gray-300 hover:text-white"
              >
                Termeni și Condiții
              </Link>
              <Link
                href="/declaratie-proprie-raspundere"
                className="block text-sm text-gray-300 hover:text-white"
              >
                Declarație pe proprie răspundere
              </Link>
              <Link
                href="/politica-de-confidentialitate"
                className="block text-sm text-gray-300 hover:text-white"
              >
                Politica de Confidențialitate
              </Link>
              <Link
                href="/politica-cookies"
                className="block text-sm text-gray-300 hover:text-white"
              >
                Politica de Cookie-uri
              </Link>
              <Link
                href="/gdpr-request-personal-data"
                className="block text-sm text-gray-300 hover:text-white"
              >
                GDPR - Solicită datele personale
              </Link>
            </nav>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contactează-ne</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Mail className="h-4 w-4" />
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="hover:text-white"
                >
                  E-mail: {contactInfo.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Phone className="h-4 w-4" />
                <div className="flex flex-col">
                  <a
                    href={`tel:${contactInfo.phones.cosma}`}
                    className="hover:text-white"
                  >
                    Cosma: {contactInfo.phones.cosma}
                  </a>
                  <a
                    href={`tel:${contactInfo.phones.filip}`}
                    className="hover:text-white"
                  >
                    Filip: {contactInfo.phones.filip}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>Adresa: {contactInfo.address}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        {/* Social Media Links */}
        <div className="flex justify-center space-x-4 mb-8">
          {socialLinks.map((social) => (
            <Button
              key={social.label}
              variant="ghost"
              size="icon"
              asChild
              className="hover:text-white text-gray-300 p-2"
            >
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="scale-150"
              >
                <social.icon className="h-5 w-5" />
              </a>
            </Button>
          ))}
        </div>

        {/* Legal Images */}
        <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
          <a
            href="https://netopia-payments.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <NTPLogo color="#ffffff" version="vertical" secret="147418" />
          </a>
          {legalImages.map((image) => (
            <a
              key={image.alt}
              href={image.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="h-auto w-auto"
              />
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-gray-300">
          <p>© {new Date().getFullYear()} Adventure-Time.ro. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  );
} 