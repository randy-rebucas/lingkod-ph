
import { collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { getDb  } from './firebase';

const categories = [
  // Construction & Building Trades
  "Carpenter", "Electrician", "Plumber", "Welder",
  "Heavy Equipment Operator", "HVAC Technician", "Roofer", "Drywaller",
  "Sheet Metal Worker", "Glazier",

  // Mechanical & Industrial Trades
  "Machinist", "Millwright", "Tool and Die Maker", "CNC Operator",
  "Automotive Technician", "Diesel Mechanic", "Aircraft Maintenance Technician",
  "Elevator Technician", "Boiler Operator",

  // Technology & Electrical Trades
  "Electronics Technician", "Line Installer/Repairer", "IT Technician/Support Specialist",
  "Network Technician", "Telecommunications Technician",

  // Service & Technical Trades
  "Chef/Cook", "Baker/Pastry Chef", "Butcher/Meat Cutter",
  "Cosmetologist", "Tattoo Artist", "Tailor/Seamstress", "Pet Groomer",

  // Transportation & Logistics
  "Commercial Driver", "Crane Operator", "Forklift Operator",
  "Ship Captain or Marine Engineer", "Train Conductor/Engineer",

  // Health & Safety Trades
  "Paramedic/EMT", "Medical Laboratory Technician", "Dental Technician",
  "Pharmacy Technician", "Firefighter", "Security System Installer",

  // Beauty Services
  "Hairdresser / Barber",
  "Makeup Artist",
  "Nail Technician / Manicurist / Pedicurist",
  "Massage Therapist",
  "Esthetician",
  "Eyelash & Brow Technician",
  "Body Waxing Technician",

  // Construction (New/Updated)
  "Mason (Panday / Masonero)",
  "Painter (Construction)",
  "Tiler (Tile Setter)",
  "Steelman (Rebar Worker)",
  "Laborer / Helper",

  // Cleaning Services
  "Housekeeper / Kasambahay",
  "Janitor / Utility Worker",
  "Window Cleaner",
  "Carpet & Upholstery Cleaner",
  "Post-Construction Cleaner",
  "Laundry Worker",
];

export async function seedCategories() {
    if (!getDb()) {
        console.warn('Firebase not initialized, skipping category seeding');
        return;
    }
    const categoriesRef = collection(getDb(), "categories");
    let newCount = 0;
    let updatedCount = 0;

    // Fetch existing categories to avoid duplicates
    const existingCategoriesSnapshot = await getDocs(categoriesRef);
    const existingCategoryNames = new Set(existingCategoriesSnapshot.docs.map(doc => doc.data().name));
    const existingCategories = existingCategoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; name: string; active?: boolean }));

    const batch = writeBatch(getDb());

    // Add new categories
    categories.forEach(categoryName => {
        if (!existingCategoryNames.has(categoryName)) {
            const newCategoryRef = doc(categoriesRef); // Create a new doc reference
            batch.set(newCategoryRef, { name: categoryName, active: true });
            newCount++;
        }
    });

    // Update existing categories that don't have the active field
    existingCategories.forEach(category => {
        if (category.active === undefined) {
            const categoryRef = doc(categoriesRef, category.id);
            batch.update(categoryRef, { active: true });
            updatedCount++;
        }
    });

    if (newCount > 0 || updatedCount > 0) {
        await batch.commit();
        if (newCount > 0) console.log(`${newCount} new categories added.`);
        if (updatedCount > 0) console.log(`${updatedCount} existing categories updated with active field.`);
    } else {
        console.log("No categories to add or update.");
    }
    
    return { newCount, updatedCount };
}
