import { redirect } from 'next/navigation';
import { generatePageMetadata } from '@/components/seo/page-seo';

export const metadata = generatePageMetadata({
  title: 'AdventureTime.Ro - Aici începe aventura ta în Caiac și pe SUP!',
  description: 'Ture caiac Herastrau, Ture caiac Delta Dunarii, Ture caiac Cazanele Dunarii, Ture caiac raul Neajlov, Ture caiac Comana, Ture caiac Grecia Paxos & Antipaxos, Ture caiac insula Mijlet - Croatia, Ture caiac Vidraru, Ture caiac raul Olt, Ture caiac lacul Mogosoaia, Ture caiac lacul Morii, Ture caiac Sulina, Cursuri caiac white water, Cursuri caiac Bucuresti, Ture caiac Bucuresti, ture caiac Snagov, Ture SUP Bucuresti, Ture SUP Delta Dunarii, Ture SUP lacul Snagov, Ture SUP Comana, Ture SUP raul Neajlov, Ture SUP Herastrau',
  keywords: [
    'ture caiac Herastrau',
    'ture caiac Delta Dunarii',
    'ture caiac Cazanele Dunarii',
    'ture caiac raul Neajlov',
    'ture caiac Comana',
    'ture caiac Grecia Paxos Antipaxos',
    'ture caiac insula Mijlet Croatia',
    'ture caiac Vidraru',
    'ture caiac raul Olt',
    'ture caiac lacul Mogosoaia',
    'ture caiac lacul Morii',
    'ture caiac Sulina',
    'cursuri caiac white water',
    'cursuri caiac Bucuresti',
    'ture caiac Bucuresti',
    'ture caiac Snagov',
    'ture SUP Bucuresti',
    'ture SUP Delta Dunarii',
    'ture SUP lacul Snagov',
    'ture SUP Comana',
    'ture SUP raul Neajlov',
    'ture SUP Herastrau',
    'caiac România',
    'SUP România',
    'AdventureTime'
  ],
  url: '/',
  type: 'website'
});

export default function Home() {
  redirect('/dashboard');
}
