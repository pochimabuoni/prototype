/**
 * The city guide: private members' clubs and luxury hotels in New York, from
 * the consolidated NYC directory (November 2026). Informational only.
 * Pochi Ma Buoni is not affiliated with any of these and cannot arrange
 * access. Fees and rates are reported or indicative figures kept for
 * internal reference; the public pages do not show them.
 */

export type ClubGroup = "contemporary" | "social" | "historic" | "university-sporting";
export type HotelTier = "ultra" | "exceptional" | "lifestyle" | "conventional";

export interface PrivateClub {
  name: string;
  address: string;
  operator: string;
  group: ClubGroup;
  /** Who the club draws, as reported. */
  profile: string;
  /** How people join, as reported. */
  access: string;
  /** Reported joining fee and annual dues in USD. "ND" means not established. */
  joiningFee: string;
  annualDues: string;
  /** Clubs built around sport. */
  sporting?: boolean;
  /** Our venue page for a sport the club offers, if any. */
  venuesHref?: string;
}

export interface Hotel {
  rank: number;
  name: string;
  address: string;
  brand: string;
  tier: HotelTier;
  /** Indicative USD per night before taxes. */
  nightlyRate: string;
}

export const CLUB_GROUPS: { value: ClubGroup; label: string }[] = [{"value": "contemporary", "label": "Ultra-exclusive contemporary clubs"}, {"value": "social", "label": "Contemporary social and lifestyle clubs"}, {"value": "historic", "label": "Historic society and cultural clubs"}, {"value": "university-sporting", "label": "University, professional and sporting clubs"}];

export const HOTEL_TIERS: { value: HotelTier; label: string }[] = [{"value": "ultra", "label": "Ultra-luxury"}, {"value": "exceptional", "label": "Exceptional luxury"}, {"value": "lifestyle", "label": "High-end lifestyle luxury"}, {"value": "conventional", "label": "Conventional luxury"}];

export const PRIVATE_CLUBS: PrivateClub[] = [
  {"name": "Aman Club", "address": "730 Fifth Ave", "operator": "Aman Group", "group": "contemporary", "profile": "Ultra-wealthy travelers; wellness and privacy", "access": "Invitation or referral", "joiningFee": "250,000", "annualDues": "20,000"},
  {"name": "Maxime’s", "address": "848 Madison Ave", "operator": "Robin Birley", "group": "contemporary", "profile": "Society, finance, international luxury", "access": "Committee approval", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "CORE", "address": "711 Fifth Ave", "operator": "CORE", "group": "contemporary", "profile": "Founders, investors, executives", "access": "Selective application", "joiningFee": "50,000 reported", "annualDues": "15,000 reported"},
  {"name": "Colette", "address": "767 Fifth Ave", "operator": "Colette", "group": "contemporary", "profile": "Senior finance and business leaders", "access": "Limited membership", "joiningFee": "125,000 reported", "annualDues": "ND"},
  {"name": "Casa Cruz", "address": "36 E 61st St", "operator": "Santa Cruz Co.", "group": "contemporary", "profile": "Fashion, finance, international society", "access": "Private investor/member model", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Kith Ivy", "address": "120 Leroy St", "operator": "Kith", "group": "contemporary", "profile": "Fashion, wellness, padel", "access": "Selective application", "joiningFee": "36,000", "annualDues": "7,000", "sporting": true},
  {"name": "ZZ’s Club", "address": "35 Hudson Yards", "operator": "Major Food Group", "group": "contemporary", "profile": "Affluent diners and business leaders", "access": "Committee approval", "joiningFee": "20,000", "annualDues": "10,000"},
  {"name": "San Vicente West Village", "address": "690 Washington St", "operator": "San Vicente", "group": "contemporary", "profile": "Entertainment, fashion, entrepreneurs", "access": "Selective application", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Casa Cipriani", "address": "10 South St", "operator": "Cipriani", "group": "contemporary", "profile": "International society and business", "access": "Application; age tiers", "joiningFee": "2,000", "annualDues": "2,500–3,900"},
  {"name": "Chez Margaux", "address": "403 W 13th St", "operator": "Jean-Georges", "group": "contemporary", "profile": "Fashion, media, affluent nightlife", "access": "Application", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Zero Bond", "address": "0 Bond St", "operator": "Scott Sartiano / Bond Hospitality", "group": "social", "profile": "Founders, celebrities, young professionals", "access": "Committee approval; age tiers", "joiningFee": "750–5,000", "annualDues": "2,750–4,400"},
  {"name": "The Ned NoMad", "address": "1170 Broadway", "operator": "The Ned", "group": "social", "profile": "Creative and business professionals", "access": "Application", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "The Twenty Two", "address": "16 E 16th St", "operator": "The Twenty Two", "group": "social", "profile": "Fashion, arts, international travelers", "access": "Reported tiers vary", "joiningFee": "1,000–1,500", "annualDues": "1,800–4,000"},
  {"name": "NEXUS Club", "address": "100 Church St", "operator": "NEXUS Luxury Collection", "group": "social", "profile": "Executives and affluent families", "access": "Application", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Flyfish Club", "address": "141 E Houston St", "operator": "VCR Group", "group": "social", "profile": "Dining enthusiasts, entrepreneurs", "access": "Ask the club for current terms", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Soho House New York", "address": "29–35 Ninth Ave", "operator": "Soho House", "group": "social", "profile": "Creative industries, media, fashion", "access": "Application; age and location tiers", "joiningFee": "ND", "annualDues": "From 2,667 reported"},
  {"name": "Ludlow House", "address": "139 Ludlow St", "operator": "Soho House", "group": "social", "profile": "Downtown creative professionals", "access": "Soho House application", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Dumbo House", "address": "55 Water St, Brooklyn", "operator": "Soho House", "group": "social", "profile": "Brooklyn creative professionals", "access": "Soho House application", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Seven24 Collective", "address": "362 W 13th St", "operator": "Gansevoort", "group": "social", "profile": "Hospitality, wellness, creatives", "access": "Ask the club for current terms", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Branch", "address": "18 W 40th St", "operator": "Park Terrace Hotel", "group": "social", "profile": "Midtown professionals", "access": "Ask the club for current terms", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Norwood Club", "address": "241 W 14th St", "operator": "Independent", "group": "social", "profile": "Arts and creative industries", "access": "Check the club is operating; ask for current terms", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Union Club", "address": "101 E 69th St", "operator": "Member club", "group": "historic", "profile": "Established society and business", "access": "Member sponsorship", "joiningFee": "50,000+ reported", "annualDues": "10,000 reported"},
  {"name": "Knickerbocker Club", "address": "2 E 62nd St", "operator": "Member club", "group": "historic", "profile": "Traditional male social circles", "access": "Member sponsorship", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Metropolitan Club", "address": "1 E 60th St", "operator": "Member club", "group": "historic", "profile": "Established wealth, civic and business leaders", "access": "Sponsorship", "joiningFee": "ND", "annualDues": "5,000 reported"},
  {"name": "Colony Club", "address": "564 Park Ave", "operator": "Member club", "group": "historic", "profile": "Traditional women’s social networks", "access": "Sponsorship", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Cosmopolitan Club", "address": "122 E 66th St", "operator": "Member club", "group": "historic", "profile": "Women in arts, culture and professions", "access": "Sponsorship", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Harmonie Club", "address": "4 E 60th St", "operator": "Member club", "group": "historic", "profile": "Established families and professionals", "access": "Sponsorship", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Union League Club", "address": "38 E 37th St", "operator": "Member club", "group": "historic", "profile": "Civic, political and business professionals", "access": "Application / sponsorship", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Century Association", "address": "7 W 43rd St", "operator": "Member club", "group": "historic", "profile": "Writers, scholars, artists", "access": "Nomination", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "National Arts Club", "address": "15 Gramercy Park S", "operator": "Nonprofit club", "group": "historic", "profile": "Artists, patrons and cultural figures", "access": "Application", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "The Players", "address": "16 Gramercy Park S", "operator": "Member club", "group": "historic", "profile": "Theater, film and literature", "access": "Application", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Salmagundi Club", "address": "47 Fifth Ave", "operator": "Nonprofit club", "group": "historic", "profile": "Visual artists and art patrons", "access": "Membership categories", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Lotos Club", "address": "5 E 66th St", "operator": "Member club", "group": "historic", "profile": "Literature, arts and professional circles", "access": "Sponsorship", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "The Explorers Club", "address": "46 E 70th St", "operator": "Nonprofit club", "group": "historic", "profile": "Explorers, scientists, researchers", "access": "Eligibility by category", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "University Club", "address": "1 W 54th St", "operator": "Member club", "group": "university-sporting", "profile": "University graduates, senior professionals", "access": "Education and sponsorship criteria", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Harvard Club", "address": "35 W 44th St", "operator": "Member club", "group": "university-sporting", "profile": "Harvard affiliates", "access": "Eligibility required", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Yale Club", "address": "50 Vanderbilt Ave", "operator": "Member club", "group": "university-sporting", "profile": "Yale affiliates", "access": "Eligibility required", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Penn Club", "address": "30 W 44th St", "operator": "Member club", "group": "university-sporting", "profile": "Penn and eligible affiliates", "access": "Eligibility required", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Cornell Club", "address": "6 E 44th St", "operator": "Member club", "group": "university-sporting", "profile": "Cornell and eligible affiliates", "access": "Eligibility required", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Columbia University Club", "address": "30 W 44th St (affiliate)", "operator": "Alumni association", "group": "university-sporting", "profile": "Columbia community", "access": "Clubhouse access may require separate dues", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Dartmouth Club", "address": "50 Vanderbilt Ave (host)", "operator": "Alumni club", "group": "university-sporting", "profile": "Dartmouth affiliates", "access": "Hosted at Yale Club", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "Williams Club", "address": "30 W 44th St (host)", "operator": "Alumni club", "group": "university-sporting", "profile": "Williams and eligible affiliates", "access": "Hosted at Penn Club", "joiningFee": "ND", "annualDues": "ND"},
  {"name": "New York Athletic Club", "address": "180 Central Park S", "operator": "Member club", "group": "university-sporting", "profile": "Athletes, executives, established families; athletic facilities", "access": "Sponsorship", "joiningFee": "ND", "annualDues": "ND", "sporting": true, "venuesHref": "/venues/swimming"},
  {"name": "Racquet & Tennis Club", "address": "370 Park Ave", "operator": "Member club", "group": "university-sporting", "profile": "Traditional racquet-sport circles", "access": "Sponsorship", "joiningFee": "ND", "annualDues": "ND", "sporting": true, "venuesHref": "/venues/squash"},
  {"name": "New York Yacht Club", "address": "37 W 44th St", "operator": "Member club", "group": "university-sporting", "profile": "Sailing and yachting community", "access": "Nomination / eligibility", "joiningFee": "ND", "annualDues": "ND", "sporting": true},
  {"name": "The Links Club", "address": "36 E 62nd St", "operator": "Member club", "group": "university-sporting", "profile": "Golf and business circles", "access": "Sponsorship", "joiningFee": "ND", "annualDues": "ND", "sporting": true},
  {"name": "The Brook", "address": "111 E 54th St", "operator": "Member club", "group": "university-sporting", "profile": "Traditional private social circles", "access": "Sponsorship", "joiningFee": "ND", "annualDues": "ND"},
];

export const HOTELS: Hotel[] = [
  {"rank": 1, "name": "Aman New York", "address": "730 Fifth Ave", "brand": "Aman Group", "tier": "ultra", "nightlyRate": "$2,000–4,500"},
  {"rank": 2, "name": "The Mark", "address": "25 E 77th St", "brand": "Independent / LHW", "tier": "ultra", "nightlyRate": "$1,200–3,000"},
  {"rank": 3, "name": "The Carlyle", "address": "35 E 76th St", "brand": "Rosewood", "tier": "ultra", "nightlyRate": "$1,000–2,500"},
  {"rank": 4, "name": "Four Seasons Midtown", "address": "57 E 57th St", "brand": "Four Seasons", "tier": "ultra", "nightlyRate": "$1,500–2,800"},
  {"rank": 5, "name": "The Peninsula", "address": "700 Fifth Ave", "brand": "Hongkong and Shanghai Hotels", "tier": "ultra", "nightlyRate": "$1,000–2,300"},
  {"rank": 6, "name": "Baccarat", "address": "28 W 53rd St", "brand": "Starwood Hotels", "tier": "ultra", "nightlyRate": "$1,000–2,400"},
  {"rank": 7, "name": "The St. Regis", "address": "2 E 55th St", "brand": "Marriott", "tier": "ultra", "nightlyRate": "$950–2,200"},
  {"rank": 8, "name": "The Lowell", "address": "28 E 63rd St", "brand": "Independent / LHW", "tier": "ultra", "nightlyRate": "$1,100–2,400"},
  {"rank": 9, "name": "Waldorf Astoria", "address": "301 Park Ave", "brand": "Hilton", "tier": "ultra", "nightlyRate": "$1,300–2,500"},
  {"rank": 10, "name": "Mandarin Oriental", "address": "80 Columbus Circle", "brand": "Mandarin Oriental", "tier": "ultra", "nightlyRate": "$950–2,200"},
  {"rank": 11, "name": "Park Hyatt", "address": "153 W 57th St", "brand": "Hyatt", "tier": "exceptional", "nightlyRate": "$900–1,900"},
  {"rank": 12, "name": "The Plaza", "address": "768 Fifth Ave", "brand": "Accor / Fairmont", "tier": "exceptional", "nightlyRate": "$900–2,000"},
  {"rank": 13, "name": "Casa Cipriani", "address": "10 South St", "brand": "Cipriani", "tier": "exceptional", "nightlyRate": "$900–2,000"},
  {"rank": 14, "name": "The Greenwich Hotel", "address": "377 Greenwich St", "brand": "Independent", "tier": "exceptional", "nightlyRate": "$900–1,800"},
  {"rank": 15, "name": "Ritz-Carlton NoMad", "address": "25 W 28th St", "brand": "Marriott", "tier": "exceptional", "nightlyRate": "$850–1,800"},
  {"rank": 16, "name": "Four Seasons Downtown", "address": "27 Barclay St", "brand": "Four Seasons", "tier": "exceptional", "nightlyRate": "$850–1,700"},
  {"rank": 17, "name": "The Surrey", "address": "20 E 76th St", "brand": "Corinthia", "tier": "exceptional", "nightlyRate": "$900–1,800"},
  {"rank": 18, "name": "Faena New York", "address": "500A W 18th St", "brand": "Faena / Accor partnership", "tier": "exceptional", "nightlyRate": "$850–1,800"},
  {"rank": 19, "name": "The Fifth Avenue Hotel", "address": "1 W 28th St", "brand": "Flâneur Hospitality", "tier": "exceptional", "nightlyRate": "$800–1,700"},
  {"rank": 20, "name": "Ritz-Carlton Central Park", "address": "50 Central Park South", "brand": "Marriott", "tier": "exceptional", "nightlyRate": "$800–1,700"},
  {"rank": 21, "name": "The Whitby", "address": "18 W 56th St", "brand": "Firmdale", "tier": "exceptional", "nightlyRate": "$900–1,700"},
  {"rank": 22, "name": "Crosby Street Hotel", "address": "79 Crosby St", "brand": "Firmdale", "tier": "exceptional", "nightlyRate": "$850–1,600"},
  {"rank": 23, "name": "The Pierre", "address": "2 E 61st St", "brand": "Taj / IHCL", "tier": "exceptional", "nightlyRate": "$700–1,500"},
  {"rank": 24, "name": "The Sherry-Netherland", "address": "781 Fifth Ave", "brand": "Independent", "tier": "exceptional", "nightlyRate": "$700–1,500"},
  {"rank": 25, "name": "The Towers at Lotte Palace", "address": "455 Madison Ave", "brand": "Lotte Hotels", "tier": "exceptional", "nightlyRate": "$800–1,800"},
  {"rank": 26, "name": "The Mercer", "address": "147 Mercer St", "brand": "Independent", "tier": "lifestyle", "nightlyRate": "$850–1,600"},
  {"rank": 27, "name": "Equinox Hotel", "address": "33 Hudson Yards", "brand": "Equinox Hotels", "tier": "lifestyle", "nightlyRate": "$700–1,400"},
  {"rank": 28, "name": "Pendry Manhattan West", "address": "438 W 33rd St", "brand": "Montage International", "tier": "lifestyle", "nightlyRate": "$700–1,400"},
  {"rank": 29, "name": "The Langham", "address": "400 Fifth Ave", "brand": "Langham Hospitality Group", "tier": "lifestyle", "nightlyRate": "$650–1,400"},
  {"rank": 30, "name": "The Twenty Two", "address": "16 E 16th St", "brand": "The Twenty Two", "tier": "lifestyle", "nightlyRate": "$600–1,300"},
  {"rank": 31, "name": "The Chatwal", "address": "130 W 44th St", "brand": "Hyatt / Unbound Collection", "tier": "lifestyle", "nightlyRate": "$650–1,300"},
  {"rank": 32, "name": "The New York EDITION", "address": "5 Madison Ave", "brand": "Marriott", "tier": "lifestyle", "nightlyRate": "$600–1,200"},
  {"rank": 33, "name": "The Bowery Hotel", "address": "335 Bowery", "brand": "Independent", "tier": "lifestyle", "nightlyRate": "$600–1,100"},
  {"rank": 34, "name": "Trump International", "address": "1 Central Park West", "brand": "Trump Hotels", "tier": "lifestyle", "nightlyRate": "$650–1,300"},
  {"rank": 35, "name": "The Manner", "address": "58 Thompson St", "brand": "Hyatt / Standard International", "tier": "lifestyle", "nightlyRate": "$500–1,000"},
  {"rank": 36, "name": "The Wall Street Hotel", "address": "88 Wall St", "brand": "Independent / Paspaley family", "tier": "lifestyle", "nightlyRate": "$550–1,000"},
  {"rank": 37, "name": "Nine Orchard", "address": "9 Orchard St", "brand": "Independent", "tier": "lifestyle", "nightlyRate": "$550–1,100"},
  {"rank": 38, "name": "Hotel Chelsea", "address": "222 W 23rd St", "brand": "Independent", "tier": "lifestyle", "nightlyRate": "$500–1,000"},
  {"rank": 39, "name": "The Dominick", "address": "246 Spring St", "brand": "Independent", "tier": "lifestyle", "nightlyRate": "$500–1,100"},
  {"rank": 40, "name": "The Beekman", "address": "123 Nassau St", "brand": "Hyatt / Thompson", "tier": "lifestyle", "nightlyRate": "$450–950"},
  {"rank": 41, "name": "Lotte New York Palace", "address": "455 Madison Ave", "brand": "Lotte Hotels", "tier": "conventional", "nightlyRate": "$450–900"},
  {"rank": 42, "name": "JW Marriott Essex House", "address": "160 Central Park South", "brand": "Marriott", "tier": "conventional", "nightlyRate": "$500–1,000"},
  {"rank": 43, "name": "Conrad New York Downtown", "address": "102 North End Ave", "brand": "Hilton", "tier": "conventional", "nightlyRate": "$450–900"},
  {"rank": 44, "name": "Luxury Collection Manhattan Midtown", "address": "151 W 54th St", "brand": "Marriott", "tier": "conventional", "nightlyRate": "$450–950"},
  {"rank": 45, "name": "Times Square EDITION", "address": "701 Seventh Ave", "brand": "Marriott", "tier": "conventional", "nightlyRate": "$400–850"},
  {"rank": 46, "name": "W New York – Union Square", "address": "201 Park Ave South", "brand": "Marriott", "tier": "conventional", "nightlyRate": "$450–900"},
  {"rank": 47, "name": "Park Lane New York", "address": "36 Central Park South", "brand": "Independent / Preferred", "tier": "conventional", "nightlyRate": "$400–850"},
  {"rank": 48, "name": "Loews Regency", "address": "540 Park Ave", "brand": "Loews Hotels", "tier": "conventional", "nightlyRate": "$450–850"},
  {"rank": 49, "name": "1 Hotel Central Park", "address": "1414 Sixth Ave", "brand": "Starwood Hotels", "tier": "conventional", "nightlyRate": "$450–900"},
  {"rank": 50, "name": "1 Hotel Brooklyn Bridge", "address": "60 Furman St, Brooklyn", "brand": "Starwood Hotels", "tier": "conventional", "nightlyRate": "$450–950"},
  {"rank": 51, "name": "InterContinental Barclay", "address": "111 E 48th St", "brand": "IHG", "tier": "conventional", "nightlyRate": "$300–700"},
  {"rank": 52, "name": "The Knickerbocker", "address": "6 Times Square", "brand": "Independent / LHW", "tier": "conventional", "nightlyRate": "$350–750"},
  {"rank": 53, "name": "The William Vale", "address": "111 N 12th St, Brooklyn", "brand": "Independent", "tier": "conventional", "nightlyRate": "$350–800"},
  {"rank": 54, "name": "Thompson Central Park", "address": "119 W 56th St", "brand": "Hyatt", "tier": "conventional", "nightlyRate": "$350–800"},
  {"rank": 55, "name": "InterContinental Times Square", "address": "300 W 44th St", "brand": "IHG", "tier": "conventional", "nightlyRate": "$300–650"},
];

export const CITY_GUIDE_DISCLAIMER =
  "Pochi Ma Buoni is not affiliated with these clubs or hotels and cannot arrange membership, access or bookings. Details come from public sources and can change, so confirm them directly. Many private clubs admit members and their guests only.";

