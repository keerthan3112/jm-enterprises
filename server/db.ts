import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Item, Order, User, DatabaseStats } from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

export interface DatabaseSchema {
  version: number;
  users: StoredUser[];
  items: Item[];
  orders: Order[];
  lastReceiptNumber: number;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const check = hashPassword(password, salt);
  return check === hash;
}

const DEFAULT_ITEMS: Item[] = [
  { id: 'x-bw', name: 'Black & White Xerox / Photocopy', category: 'Xerox', price: 2, unit: 'per page', inStock: true, description: 'Single or double-sided 75 GSM crisp print' },
  { id: 'x-color', name: 'Colour Xerox / Photocopy', category: 'Xerox', price: 10, unit: 'per page', inStock: true, description: 'High resolution vibrant colour copy' },
  { id: 'p-bw', name: 'B&W Printout (A4)', category: 'Printing', price: 2, unit: 'per page', inStock: true, description: 'Laser print from WhatsApp / Email / Pen-drive' },
  { id: 'p-color', name: 'Colour Printout (A4)', category: 'Printing', price: 10, unit: 'per page', inStock: true, description: 'Photo-quality inkjet / laser printout' },
  { id: 'p-photo', name: 'Passport Photo Print (Set of 8)', category: 'Printing', price: 30, unit: 'per set', inStock: true, description: 'Instant glossy passport photos with white/blue background' },
  { id: 'p-lam', name: 'Lamination (A4 Document)', category: 'Printing', price: 20, unit: 'per sheet', inStock: true, description: 'Heavy-duty waterproof document lamination' },
  { id: 'p-bind', name: 'Spiral Binding with Transparent Cover', category: 'Printing', price: 40, unit: 'per book', inStock: true, description: 'Project reports, notes, presentations up to 200 pages' },
  { id: 'p-idcard', name: 'ID Card Print & Lamination', category: 'Printing', price: 50, unit: 'per card', inStock: true, description: 'Aadhaar, PAN, College / School ID pouch' },
  { id: 's-pen-blue', name: 'Ball Pen (Blue ink)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Smooth flow ballpoint pen' },
  { id: 's-pen-black', name: 'Ball Pen (Black ink)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Official document writing pen' },
  { id: 's-gel-pen', name: 'Waterproof Gel Pen (0.5mm)', category: 'Stationery', price: 20, unit: 'per piece', inStock: true, description: 'Smudge-free fine tip gel pen' },

  // Brand Pens & Special Ink Pens (Cello, Reynolds, Hauser, Pentonic, Flair, Pilot, Rorito, Uniball, Parker, Montex, Luxor)
  // Cello
  { id: 'pen-cello-butterflow-blue', name: 'Cello Butterflow Ball Pen (Blue)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Cello | Type: Ballpoint | Ink: Blue | Ultra-smooth low viscosity ink' },
  { id: 'pen-cello-butterflow-black', name: 'Cello Butterflow Ball Pen (Black)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Cello | Type: Ballpoint | Ink: Black | Official writing & documentation' },
  { id: 'pen-cello-butterflow-red', name: 'Cello Butterflow Ball Pen (Red)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Cello | Type: Ballpoint | Ink: Red | Teacher corrections & markup' },
  { id: 'pen-cello-gripper-blue', name: 'Cello Gripper Ball Pen (Blue)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Cello | Type: Ballpoint | Ink: Blue | Ergonomic soft rubber grip' },
  { id: 'pen-cello-gripper-black', name: 'Cello Gripper Ball Pen (Black)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Cello | Type: Ballpoint | Ink: Black | Soft rubber grip for exam writing' },
  { id: 'pen-cello-maxriter-blue', name: 'Cello Maxriter Ball Pen (Blue)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Cello | Type: Ballpoint | Ink: Blue | Extra-long writing reservoir' },
  { id: 'pen-cello-technotip-blue', name: 'Cello Technotip Ball Pen (0.6mm Blue)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Cello | Type: Ballpoint | Ink: Blue | Fine 0.6mm needle tip' },
  { id: 'pen-cello-geltech-blue', name: 'Cello Geltech Waterproof Gel Pen (Blue)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Cello | Type: Gel Pen | Ink: Blue | Waterproof quick-dry gel' },
  { id: 'pen-cello-geltech-black', name: 'Cello Geltech Waterproof Gel Pen (Black)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Cello | Type: Gel Pen | Ink: Black | Waterproof quick-dry gel' },
  { id: 'pen-cello-pointer-green', name: 'Cello Pointer Ball Pen (Green)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Cello | Type: Ballpoint | Ink: Green | Officer signature & audit notation' },

  // Reynolds
  { id: 'pen-reynolds-045-blue', name: 'Reynolds 045 Fine Carbure Ball Pen (Blue)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Reynolds | Type: Ballpoint | Ink: Blue | Classic non-smudge student pen' },
  { id: 'pen-reynolds-045-black', name: 'Reynolds 045 Fine Carbure Ball Pen (Black)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Reynolds | Type: Ballpoint | Ink: Black | Precision laser tip 0.7mm' },
  { id: 'pen-reynolds-045-red', name: 'Reynolds 045 Fine Carbure Ball Pen (Red)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Reynolds | Type: Ballpoint | Ink: Red | Checking & marking' },
  { id: 'pen-reynolds-trimax-blue', name: 'Reynolds Trimax Liquid Gel Pen (Blue)', category: 'Stationery', price: 60, unit: 'per piece', inStock: true, description: 'Brand: Reynolds | Type: Rollerball / Gel | Ink: Blue | Advanced fluid ink system & refillable' },
  { id: 'pen-reynolds-trimax-black', name: 'Reynolds Trimax Liquid Gel Pen (Black)', category: 'Stationery', price: 60, unit: 'per piece', inStock: true, description: 'Brand: Reynolds | Type: Rollerball / Gel | Ink: Black | Jet black refillable precision roller' },
  { id: 'pen-reynolds-jetter-blue', name: 'Reynolds Jetter Classic Retractable Ball Pen (Blue)', category: 'Stationery', price: 35, unit: 'per piece', inStock: true, description: 'Brand: Reynolds | Type: Ballpoint | Ink: Blue | Click push-button executive metal clip' },
  { id: 'pen-reynolds-aeroslim-blue', name: 'Reynolds Aeroslim Ball Pen (Blue)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Reynolds | Type: Ballpoint | Ink: Blue | Lightweight slim body' },

  // Hauser
  { id: 'pen-hauser-xo-blue', name: 'Hauser XO Ultra-Glide Ball Pen (Blue)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Hauser | Type: Ballpoint | Ink: Blue | German technology ultra-smooth glide' },
  { id: 'pen-hauser-xo-black', name: 'Hauser XO Ultra-Glide Ball Pen (Black)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Hauser | Type: Ballpoint | Ink: Black | Dark intense black german ink' },
  { id: 'pen-hauser-xo-red', name: 'Hauser XO Ultra-Glide Ball Pen (Red)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Hauser | Type: Ballpoint | Ink: Red | German ink smooth flow' },
  { id: 'pen-hauser-xo-green', name: 'Hauser XO Ultra-Glide Ball Pen (Green)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Hauser | Type: Ballpoint | Ink: Green | Signatures & grading' },
  { id: 'pen-hauser-sonic-blue', name: 'Hauser Sonic Gel Pen (Blue 0.5mm)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Hauser | Type: Gel Pen | Ink: Blue | Waterproof Japanese tip gel' },
  { id: 'pen-hauser-fluid-blue', name: 'Hauser Fluid Liquid Ink Roller Pen (Blue)', category: 'Stationery', price: 25, unit: 'per piece', inStock: true, description: 'Brand: Hauser | Type: Rollerball | Ink: Blue | Continuous liquid ink flow' },

  // Pentonic / Linc
  { id: 'pen-pentonic-ball-blue', name: 'Pentonic 0.7mm Featherlite Ball Pen (Blue)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Pentonic | Type: Ballpoint | Ink: Blue | Matte black barrel sleek featherlite' },
  { id: 'pen-pentonic-ball-black', name: 'Pentonic 0.7mm Featherlite Ball Pen (Black)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Pentonic | Type: Ballpoint | Ink: Black | Matte black finish precision ball' },
  { id: 'pen-pentonic-ball-red', name: 'Pentonic 0.7mm Featherlite Ball Pen (Red)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Pentonic | Type: Ballpoint | Ink: Red | Smooth flowing red ink' },
  { id: 'pen-pentonic-ball-green', name: 'Pentonic 0.7mm Featherlite Ball Pen (Green)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Pentonic | Type: Ballpoint | Ink: Green | Official green marking ink' },
  { id: 'pen-pentonic-brt-blue', name: 'Pentonic B-RT Retractable Click Ball Pen (Blue)', category: 'Stationery', price: 20, unit: 'per piece', inStock: true, description: 'Brand: Pentonic | Type: Ballpoint | Ink: Blue | Retractable push-button click' },
  { id: 'pen-pentonic-brt-black', name: 'Pentonic B-RT Retractable Click Ball Pen (Black)', category: 'Stationery', price: 20, unit: 'per piece', inStock: true, description: 'Brand: Pentonic | Type: Ballpoint | Ink: Black | Click mechanism smooth dark ink' },
  { id: 'pen-pentonic-frost-gel-blue', name: 'Pentonic Frost Gel Pen (Blue 0.6mm)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Pentonic | Type: Gel Pen | Ink: Blue | Frosted body high speed gel' },
  { id: 'pen-pentonic-assorted-pack', name: 'Pentonic Multicolor Ball Pens (Pack of 10 Assorted)', category: 'Stationery', price: 100, unit: 'per pack', inStock: true, description: 'Brand: Pentonic | Type: Ballpoint | Ink: Assorted | 10 vibrant colours set' },

  // Flair
  { id: 'pen-flair-writometer-blue', name: 'Flair Writometer Ball Pen (Blue - 10,000 Meters)', category: 'Stationery', price: 30, unit: 'per piece', inStock: true, description: 'Brand: Flair | Type: Ballpoint | Ink: Blue | Writes 10,000 meters non-stop with meter scale' },
  { id: 'pen-flair-writometer-black', name: 'Flair Writometer Ball Pen (Black - 10,000 Meters)', category: 'Stationery', price: 30, unit: 'per piece', inStock: true, description: 'Brand: Flair | Type: Ballpoint | Ink: Black | Long writing 10,000 meters meter pen' },
  { id: 'pen-flair-glass-gel-blue', name: 'Flair Glass Gel Pen (Blue 0.5mm)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Flair | Type: Gel Pen | Ink: Blue | Transparent body smooth needle gel' },
  { id: 'pen-flair-glass-gel-black', name: 'Flair Glass Gel Pen (Black 0.5mm)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Flair | Type: Gel Pen | Ink: Black | Smudge-proof black gel' },
  { id: 'pen-flair-ezee-click-blue', name: 'Flair Ezee Click Retractable Ball Pen (Blue)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Flair | Type: Ballpoint | Ink: Blue | Pocket-friendly click ball pen' },
  { id: 'pen-flair-carbonix-blue', name: 'Flair Carbonix Ball Pen (Blue)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Flair | Type: Ballpoint | Ink: Blue | Dark carbon ink technology' },
  { id: 'pen-flair-inky-fountain', name: 'Flair Inky Liquid Ink Fountain Pen (Blue)', category: 'Stationery', price: 40, unit: 'per piece', inStock: true, description: 'Brand: Flair | Type: Fountain Pen | Ink: Blue | Smooth iridium tip with ink cartridge' },

  // Pilot
  { id: 'pen-pilot-v5-blue', name: 'Pilot V5 Hi-Tecpoint Liquid Ink Rollerball Pen (Blue)', category: 'Stationery', price: 60, unit: 'per piece', inStock: true, description: 'Brand: Pilot | Type: Rollerball | Ink: Blue | Japanese 0.5mm extra fine dimple tip' },
  { id: 'pen-pilot-v5-black', name: 'Pilot V5 Hi-Tecpoint Liquid Ink Rollerball Pen (Black)', category: 'Stationery', price: 60, unit: 'per piece', inStock: true, description: 'Brand: Pilot | Type: Rollerball | Ink: Black | 0.5mm needle point official black' },
  { id: 'pen-pilot-v5-red', name: 'Pilot V5 Hi-Tecpoint Liquid Ink Rollerball Pen (Red)', category: 'Stationery', price: 60, unit: 'per piece', inStock: true, description: 'Brand: Pilot | Type: Rollerball | Ink: Red | Precision red correction pen' },
  { id: 'pen-pilot-v5-green', name: 'Pilot V5 Hi-Tecpoint Liquid Ink Rollerball Pen (Green)', category: 'Stationery', price: 60, unit: 'per piece', inStock: true, description: 'Brand: Pilot | Type: Rollerball | Ink: Green | Signature & approval ink' },
  { id: 'pen-pilot-v7-blue', name: 'Pilot V7 Hi-Tecpoint Rollerball Pen (Blue 0.7mm Bold)', category: 'Stationery', price: 60, unit: 'per piece', inStock: true, description: 'Brand: Pilot | Type: Rollerball | Ink: Blue | 0.7mm medium bold line liquid ink' },
  { id: 'pen-pilot-g2-blue', name: 'Pilot G2 Premium Retractable Gel Pen (Blue 0.7mm)', category: 'Stationery', price: 90, unit: 'per piece', inStock: true, description: 'Brand: Pilot | Type: Gel Pen | Ink: Blue | Cushioned grip dynamic gel formulation' },

  // Rorito
  { id: 'pen-rorito-flymax-blue', name: 'Rorito Flymax Gel Pen (Blue)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Rorito | Type: Gel Pen | Ink: Blue | High speed waterproof gel writing' },
  { id: 'pen-rorito-flymax-black', name: 'Rorito Flymax Gel Pen (Black)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Rorito | Type: Gel Pen | Ink: Black | Deep black waterproof gel' },
  { id: 'pen-rorito-teramax-blue', name: 'Rorito Teramax Liquid Gel Pen (Blue)', category: 'Stationery', price: 50, unit: 'per piece', inStock: true, description: 'Brand: Rorito | Type: Rollerball / Gel | Ink: Blue | High tech liquid ink flow' },
  { id: 'pen-rorito-robomax-blue', name: 'Rorito Robomax Ball Pen (Blue)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Rorito | Type: Ballpoint | Ink: Blue | Robot tip sturdy ball pen' },

  // Uniball / Mitsubishi
  { id: 'pen-uniball-eye-blue', name: 'Uniball Eye UB-150 Rollerball Pen (Blue)', category: 'Stationery', price: 85, unit: 'per piece', inStock: true, description: 'Brand: Uniball | Type: Rollerball | Ink: Blue | Fade-proof waterproof Super Ink system' },
  { id: 'pen-uniball-eye-black', name: 'Uniball Eye UB-150 Rollerball Pen (Black)', category: 'Stationery', price: 85, unit: 'per piece', inStock: true, description: 'Brand: Uniball | Type: Rollerball | Ink: Black | Legal & document proof tamper-proof ink' },
  { id: 'pen-uniball-eye-red', name: 'Uniball Eye UB-150 Rollerball Pen (Red)', category: 'Stationery', price: 85, unit: 'per piece', inStock: true, description: 'Brand: Uniball | Type: Rollerball | Ink: Red | High precision stainless steel tip' },
  { id: 'pen-uniball-jetstream-blue', name: 'Uniball Jetstream Quick-Drying Ball Pen (Blue)', category: 'Stationery', price: 60, unit: 'per piece', inStock: true, description: 'Brand: Uniball | Type: Ballpoint | Ink: Blue | Hybrid ink dries 9x faster, zero smudge' },

  // Parker
  { id: 'pen-parker-beta-ball-blue', name: 'Parker Beta Standard Ballpoint Pen (Blue)', category: 'Stationery', price: 150, unit: 'per piece', inStock: true, description: 'Brand: Parker | Type: Ballpoint | Ink: Blue | Gift box executive ball pen with quink flow refill' },
  { id: 'pen-parker-vector-roller-blue', name: 'Parker Vector Stainless Steel Rollerball Pen (Blue)', category: 'Stationery', price: 350, unit: 'per piece', inStock: true, description: 'Brand: Parker | Type: Rollerball | Ink: Blue | Premium stainless steel body roller pen' },

  // Montex
  { id: 'pen-montex-megatop-blue', name: 'Montex Mega Top Ball Pen (Blue)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Brand: Montex | Type: Ballpoint | Ink: Blue | Legendary student ball pen' },
  { id: 'pen-montex-winner-gel-blue', name: 'Montex Winner Gel Pen (Blue)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Montex | Type: Gel Pen | Ink: Blue | Needle point smooth gel pen' },

  // Luxor
  { id: 'pen-luxor-finewriter-blue', name: 'Luxor Fine Writer 0.5mm Micro-tip Pen (Blue)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Luxor | Type: Fineliner | Ink: Blue | Japanese polyacetal tip for ruled & sketch writing' },
  { id: 'pen-luxor-finewriter-black', name: 'Luxor Fine Writer 0.5mm Micro-tip Pen (Black)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Luxor | Type: Fineliner | Ink: Black | Fine technical drawing & outline pen' },
  { id: 'pen-luxor-finewriter-red', name: 'Luxor Fine Writer 0.5mm Micro-tip Pen (Red)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Luxor | Type: Fineliner | Ink: Red | Precise line marking & editing' },
  { id: 'pen-luxor-finewriter-green', name: 'Luxor Fine Writer 0.5mm Micro-tip Pen (Green)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Brand: Luxor | Type: Fineliner | Ink: Green | Signatures & highlighting' },
  { id: 'pen-luxor-graphic-set', name: 'Luxor Graphic Fineliner Pens (Set of 10 Colors)', category: 'Stationery', price: 150, unit: 'per pack', inStock: true, description: 'Brand: Luxor | Type: Fineliner | Ink: Assorted | 10 vibrant fineline colors for sketching & charts' },
  { id: 's-pencil', name: 'Pencil (HB Dark)', category: 'Stationery', price: 5, unit: 'per piece', inStock: true, description: 'Standard student writing pencil' },
  { id: 's-eraser', name: 'Dust-free Eraser', category: 'Stationery', price: 5, unit: 'per piece', inStock: true, description: 'Clean erasing without paper tearing' },
  { id: 's-sharp', name: 'Sharpener with Container', category: 'Stationery', price: 5, unit: 'per piece', inStock: true, description: 'Anti-rust blade' },
  { id: 's-scale', name: 'Ruler Scale (15cm)', category: 'Stationery', price: 10, unit: 'per piece', inStock: true, description: 'Clear transparent plastic ruler' },
  { id: 's-steel-scale', name: 'Steel Ruler (30cm / 12 inch)', category: 'Stationery', price: 35, unit: 'per piece', inStock: true, description: 'Heavy-duty stainless steel scale' },
  // Standard Notebooks - 100 Pages
  { id: 'nb-std-100-single', name: 'Notebook (100 Pages - Single Line)', category: 'Stationery', price: 35, unit: 'per book', inStock: true, description: 'Standard size notebook, single line ruled, 100 pages' },
  { id: 'nb-std-100-2line', name: 'Notebook (100 Pages - 2 Lines)', category: 'Stationery', price: 35, unit: 'per book', inStock: true, description: 'Standard size 2-line ruled notebook (Hindi/language), 100 pages' },
  { id: 'nb-std-100-4line', name: 'Notebook (100 Pages - 4 Lines)', category: 'Stationery', price: 35, unit: 'per book', inStock: true, description: 'Standard size 4-line ruled notebook (English handwriting), 100 pages' },
  { id: 'nb-std-100-square', name: 'Notebook (100 Pages - Square Ruled / Maths)', category: 'Stationery', price: 35, unit: 'per book', inStock: true, description: 'Standard size math square grid notebook, 100 pages' },
  { id: 'nb-std-100-unruled', name: 'Notebook (100 Pages - Unruled / Plain)', category: 'Stationery', price: 35, unit: 'per book', inStock: true, description: 'Standard size plain blank notebook, 100 pages' },

  // Standard Notebooks - 200 Pages
  { id: 'nb-std-200-single', name: 'Notebook (200 Pages - Single Line)', category: 'Stationery', price: 65, unit: 'per book', inStock: true, description: 'Standard size notebook, single line ruled, 200 pages' },
  { id: 'nb-std-200-2line', name: 'Notebook (200 Pages - 2 Lines)', category: 'Stationery', price: 65, unit: 'per book', inStock: true, description: 'Standard size 2-line ruled notebook, 200 pages' },
  { id: 'nb-std-200-4line', name: 'Notebook (200 Pages - 4 Lines)', category: 'Stationery', price: 65, unit: 'per book', inStock: true, description: 'Standard size 4-line ruled notebook, 200 pages' },
  { id: 'nb-std-200-square', name: 'Notebook (200 Pages - Square Ruled / Maths)', category: 'Stationery', price: 65, unit: 'per book', inStock: true, description: 'Standard size math square grid notebook, 200 pages' },
  { id: 'nb-std-200-unruled', name: 'Notebook (200 Pages - Unruled / Plain)', category: 'Stationery', price: 65, unit: 'per book', inStock: true, description: 'Standard size plain blank notebook, 200 pages' },

  // Long Notebooks - 100 Pages & 200 Pages
  { id: 'nb-long-100-single', name: 'Long Notebook (100 Pages - Single Line)', category: 'Stationery', price: 50, unit: 'per book', inStock: true, description: 'Long size student notebook, single line ruled, 100 pages' },
  { id: 'nb-long-100-4line', name: 'Long Notebook (100 Pages - 4 Lines)', category: 'Stationery', price: 50, unit: 'per book', inStock: true, description: 'Long size 4-line ruled notebook, 100 pages' },
  { id: 'nb-long-100-unruled', name: 'Long Notebook (100 Pages - Unruled / Plain)', category: 'Stationery', price: 50, unit: 'per book', inStock: true, description: 'Long size unruled blank notebook, 100 pages' },
  { id: 'nb-long-200-single', name: 'Long Notebook (200 Pages - Single Line)', category: 'Stationery', price: 90, unit: 'per book', inStock: true, description: 'Long size student notebook, single line ruled, 200 pages' },
  { id: 'nb-long-200-4line', name: 'Long Notebook (200 Pages - 4 Lines)', category: 'Stationery', price: 90, unit: 'per book', inStock: true, description: 'Long size 4-line ruled notebook, 200 pages' },
  { id: 'nb-long-200-unruled', name: 'Long Notebook (200 Pages - Unruled / Plain)', category: 'Stationery', price: 90, unit: 'per book', inStock: true, description: 'Long size unruled blank notebook, 200 pages' },

  // King Size Notebooks - 100 Pages & 200 Pages
  { id: 'nb-king-100-single', name: 'King Size Notebook (100 Pages - Single Line)', category: 'Stationery', price: 60, unit: 'per book', inStock: true, description: 'Extra large King Size notebook, single line ruled, 100 pages' },
  { id: 'nb-king-100-4line', name: 'King Size Notebook (100 Pages - 4 Lines)', category: 'Stationery', price: 60, unit: 'per book', inStock: true, description: 'Extra large King Size notebook, 4 lines, 100 pages' },
  { id: 'nb-king-100-unruled', name: 'King Size Notebook (100 Pages - Unruled / Plain)', category: 'Stationery', price: 60, unit: 'per book', inStock: true, description: 'Extra large King Size notebook, plain unruled, 100 pages' },
  { id: 'nb-king-200-single', name: 'King Size Notebook (200 Pages - Single Line)', category: 'Stationery', price: 110, unit: 'per book', inStock: true, description: 'Extra large King Size notebook, single line ruled, 200 pages' },
  { id: 'nb-king-200-unruled', name: 'King Size Notebook (200 Pages - Unruled / Plain)', category: 'Stationery', price: 110, unit: 'per book', inStock: true, description: 'Extra large King Size notebook, plain unruled, 200 pages' },

  // Account Registers & Quire Books (3Q, 4Q, 5Q)
  { id: 'nb-reg-3q', name: 'Account Register Book (3Q - 3 Quire / ~288 Pages)', category: 'Stationery', price: 140, unit: 'per book', inStock: true, description: 'Hardbound heavy account register book, 3 Quire (approx. 288 pages)' },
  { id: 'nb-reg-4q', name: 'Account Register Book (4Q - 4 Quire / ~384 Pages)', category: 'Stationery', price: 180, unit: 'per book', inStock: true, description: 'Hardbound heavy account register book, 4 Quire (approx. 384 pages)' },
  { id: 'nb-reg-5q', name: 'Account Register Book (5Q - 5 Quire / ~480 Pages)', category: 'Stationery', price: 220, unit: 'per book', inStock: true, description: 'Hardbound heavy account register book, 5 Quire (approx. 480 pages)' },
  { id: 's-a4-bundle', name: 'A4 Copier Paper Bundle (100 Sheets)', category: 'Stationery', price: 150, unit: 'per pack', inStock: true, description: '75 GSM Bright white multipurpose paper' },
  { id: 's-a4-rim', name: 'A4 Copier Paper Full Ream (500 Sheets)', category: 'Stationery', price: 340, unit: 'per ream', inStock: true, description: '75 GSM premium copier ream' },
  { id: 's-file', name: 'Clear File Folder (Stick/Clip)', category: 'Stationery', price: 25, unit: 'per piece', inStock: true, description: 'Document presentation folder' },
  { id: 's-marker', name: 'Permanent Marker (Black/Blue)', category: 'Stationery', price: 20, unit: 'per piece', inStock: true, description: 'Waterproof multi-surface marker' },
  { id: 's-highlight', name: 'Fluorescent Highlighter', category: 'Stationery', price: 25, unit: 'per piece', inStock: true, description: 'Bright yellow/green text marker' },
  { id: 's-glue', name: 'Fevistik Glue Stick (15g)', category: 'Stationery', price: 20, unit: 'per piece', inStock: true, description: 'Clean mess-free paper glue' },
  { id: 's-tape', name: 'Transparent Cello Tape (1 inch)', category: 'Stationery', price: 15, unit: 'per piece', inStock: true, description: 'Strong adhesive tape' },
  { id: 's-stapler', name: 'Stapler No. 10 with Pins Box', category: 'Stationery', price: 65, unit: 'per set', inStock: true, description: 'Compact office/school stapler' },
  { id: 's-envelope', name: 'Official Brown Envelope', category: 'Stationery', price: 5, unit: 'per piece', inStock: true, description: 'Standard postal letter envelope' },
  { id: 'm-transfer', name: 'Domestic Money Transfer (DMT / IMPS)', category: 'Money Transfer', price: 10, unit: 'service fee / ₹1000', inStock: true, description: 'Instant bank account transfer 24x7 with receipt' },
  { id: 'm-aeps', name: 'Aadhaar ATM Cash Withdrawal', category: 'Money Transfer', price: 15, unit: 'convenience fee', inStock: true, description: 'Micro-ATM fingerprint cash withdrawal service' },
];

function getInitialDatabase(): DatabaseSchema {
  const adminSalt = generateSalt();
  const customerSalt = generateSalt();

  const now = Date.now();
  const yesterday = now - 24 * 60 * 60 * 1000;

  const initialOrders: Order[] = [
    {
      id: 'jm-ord-001',
      receiptNumber: '001',
      createdAt: yesterday,
      customerName: 'Prashanth Singh',
      customerPhone: '8747991688',
      note: 'Please spiral bind with transparent sheet on front',
      lines: [
        { itemId: 'p-bw', name: 'B&W Printout (A4)', price: 2, qty: 35, category: 'Printing' },
        { itemId: 'p-bind', name: 'Spiral Binding with Transparent Cover', price: 40, qty: 1, category: 'Printing' },
        { itemId: 's-pen-blue', name: 'Ball Pen (Blue ink)', price: 10, qty: 2, category: 'Stationery' },
      ],
      subtotal: 130,
      total: 130,
      status: 'completed',
      kind: 'order',
      paymentMethod: 'upi',
      upiRef: 'UPI-77492810'
    },
    {
      id: 'jm-ord-002',
      receiptNumber: '002',
      createdAt: now - 3 * 60 * 60 * 1000,
      customerName: 'Ramesh Kumar',
      customerPhone: '9845012345',
      note: 'Urgent transfer to SBI AC 30981293812',
      lines: [
        { itemId: 'm-transfer', name: 'Domestic Money Transfer (DMT / IMPS)', price: 20, qty: 1, category: 'Money Transfer' }
      ],
      subtotal: 20,
      transferAmount: 2000,
      serviceFee: 20,
      total: 2020,
      status: 'paid',
      kind: 'money_transfer',
      paymentMethod: 'cash'
    }
  ];

  return {
    version: 1,
    lastReceiptNumber: 2,
    users: [
      {
        id: 'usr-admin-01',
        name: 'JM ADMIN',
        email: 'jm.enterprises.3112@gmail.com',
        phone: '8747991688',
        role: 'admin',
        createdAt: now - 30 * 24 * 60 * 60 * 1000,
        salt: adminSalt,
        passwordHash: hashPassword('admin123', adminSalt),
      },
    ],
    items: DEFAULT_ITEMS,
    orders: initialOrders,
  };
}

class Database {
  private db: DatabaseSchema;
  private initialized = false;

  constructor() {
    this.db = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        if (parsed && Array.isArray(parsed.items) && Array.isArray(parsed.orders)) {
          // Sync any new default items (e.g. notebook variations)
          const existingIds = new Set(parsed.items.map((i) => i.id));
          let modified = false;
          for (const item of DEFAULT_ITEMS) {
            if (!existingIds.has(item.id)) {
              parsed.items.push(item);
              modified = true;
            }
          }
          if (modified) {
            this.saveDirect(parsed);
          }
          this.initialized = true;
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error reading database file, initializing fresh store:', err);
    }

    const fresh = getInitialDatabase();
    this.saveDirect(fresh);
    this.initialized = true;
    return fresh;
  }

  private saveDirect(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error writing database to disk:', err);
    }
  }

  public save(): void {
    this.saveDirect(this.db);
  }

  public resetToDefaults(): DatabaseSchema {
    this.db = getInitialDatabase();
    this.save();
    return this.db;
  }

  // Clear registered users (preserves admin accounts)
  public clearRegisteredUsers(): { removedCount: number } {
    const beforeCount = this.db.users.length;
    this.db.users = this.db.users.filter((u) => u.role === 'admin' || u.id === 'usr-admin-01');
    const removedCount = beforeCount - this.db.users.length;
    this.save();
    return { removedCount };
  }

  // Users
  public getUsers(): User[] {
    return this.db.users.map(({ passwordHash, salt, ...user }) => user);
  }

  public findUserByEmailOrPhone(query: string): StoredUser | undefined {
    const q = query.trim().toLowerCase();
    return this.db.users.find(
      (u) =>
        u.email.toLowerCase() === q ||
        u.phone === q ||
        (q === 'admin' && u.role === 'admin')
    );
  }

  public findUserById(id: string): StoredUser | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  public createUser(params: { name: string; email: string; phone: string; password: string; role?: 'customer' | 'admin' }): User {
    const salt = generateSalt();
    const passwordHash = hashPassword(params.password, salt);
    const newUser: StoredUser = {
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      phone: params.phone.trim(),
      role: params.role || 'customer',
      createdAt: Date.now(),
      salt,
      passwordHash,
    };

    this.db.users.push(newUser);
    this.save();

    const { salt: _s, passwordHash: _p, ...safeUser } = newUser;
    return safeUser;
  }

  // Items
  public getItems(): Item[] {
    return this.db.items;
  }

  public getItemById(id: string): Item | undefined {
    return this.db.items.find((i) => i.id === id);
  }

  public addItem(item: Omit<Item, 'id'>): Item {
    const newItem: Item = {
      ...item,
      id: `itm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      inStock: item.inStock ?? true,
    };
    this.db.items.push(newItem);
    this.save();
    return newItem;
  }

  public updateItem(id: string, updates: Partial<Item>): Item | null {
    const idx = this.db.items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this.db.items[idx] = { ...this.db.items[idx], ...updates, id };
    this.save();
    return this.db.items[idx];
  }

  public deleteItem(id: string): boolean {
    const prevLen = this.db.items.length;
    this.db.items = this.db.items.filter((i) => i.id !== id);
    if (this.db.items.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Orders
  public getOrders(customerId?: string): Order[] {
    if (customerId) {
      return this.db.orders
        .filter((o) => o.customerId === customerId)
        .sort((a, b) => b.createdAt - a.createdAt);
    }
    return [...this.db.orders].sort((a, b) => b.createdAt - a.createdAt);
  }

  public getOrderById(idOrReceipt: string): Order | undefined {
    const query = idOrReceipt.trim().toLowerCase();
    const cleanNum = query.replace(/^0+/, '');
    return this.db.orders.find(
      (o) =>
        o.id.toLowerCase() === query ||
        o.receiptNumber.toLowerCase() === query ||
        (cleanNum.length > 0 && o.receiptNumber.replace(/^0+/, '') === cleanNum) ||
        o.customerPhone === query ||
        o.customerPhone.includes(query)
    );
  }

  public createOrder(data: Omit<Order, 'id' | 'receiptNumber' | 'createdAt'>): Order {
    this.db.lastReceiptNumber = (this.db.lastReceiptNumber || 0) + 1;
    const receiptNumber = String(this.db.lastReceiptNumber).padStart(3, '0');
    const id = `jm-ord-${receiptNumber}`;

    const newOrder: Order = {
      ...data,
      id,
      receiptNumber,
      createdAt: Date.now(),
      status: data.status || 'pending',
    };

    this.db.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  public resetBillSequence(startingNumber: number = 0): number {
    this.db.lastReceiptNumber = startingNumber;
    this.save();
    return this.db.lastReceiptNumber;
  }

  public updateOrderStatus(id: string, status: Order['status']): Order | null {
    const order = this.db.orders.find((o) => o.id === id || o.receiptNumber === id);
    if (!order) return null;
    order.status = status;
    order.updatedAt = Date.now();
    this.save();
    return order;
  }

  public getStats(): DatabaseStats {
    const totalOrders = this.db.orders.length;
    const totalRevenue = this.db.orders.reduce((sum, o) => {
      // If completed or paid, include in revenue calculation
      if (o.status === 'paid' || o.status === 'completed') {
        return sum + o.total;
      }
      return sum;
    }, 0);

    const pendingOrders = this.db.orders.filter((o) => o.status === 'pending').length;
    const completedOrders = this.db.orders.filter((o) => o.status === 'completed').length;
    const totalUsers = this.db.users.length;
    const totalItems = this.db.items.length;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      completedOrders,
      totalUsers,
      totalItems,
      lastUpdated: Date.now(),
    };
  }
}

export const db = new Database();
