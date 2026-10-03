import { Category } from './types';
export interface CatalogCategory extends Category { subcategories: { id: string; name: string }[]; }
export const TRADEASE_CATALOG: CatalogCategory[] = [
{id:'fashion-apparel',name:'Fashion & Apparel',iconName:'Shirt',color:'',subcategories:[{id:'mens-fashion',name:"Men's Fashion"},{id:'womens-fashion',name:"Women's Fashion"},{id:'kids-fashion',name:"Kid's Fashion"}]},
{id:'electronics-gadgets',name:'Electronics & Gadgets',iconName:'Smartphone',color:'',subcategories:[{id:'phones-tablets',name:'Phones & Tablets'},{id:'computers-accessories',name:'Computers & Accessories'},{id:'tvs',name:'TVs'},{id:'audio',name:'Audio'},{id:'gaming',name:'Gaming'},{id:'wearables',name:'Wearables'}]},
{id:'home-kitchen',name:'Home & Kitchen',iconName:'Home',color:'',subcategories:[{id:'furniture',name:'Furniture'},{id:'home-decor',name:'Home Decor'},{id:'bedding',name:'Bedding'},{id:'kitchen-appliances',name:'Kitchen Appliances'},{id:'cookware',name:'Cookware'}]},
{id:'beauty-health-personal-care',name:'Beauty, Health & Personal Care',iconName:'Sparkles',color:'',subcategories:[{id:'makeup',name:'MakeUp'},{id:'skincare',name:'Skincare'},{id:'hair-care',name:'Hair Care'},{id:'fragrances',name:'Fragrances'},{id:'health-supplements',name:'Health Supplements'}]},
{id:'grocery-food',name:'Grocery & Food',iconName:'Utensils',color:'',subcategories:[{id:'packaged-foods',name:'Packaged Foods'},{id:'fresh-produce',name:'Fresh Produce'},{id:'drinks',name:'Drinks'},{id:'snacks',name:'Snacks'}]},
{id:'automotive',name:'Automotive',iconName:'Car',color:'',subcategories:[{id:'car-accessories',name:'Car Accessories'},{id:'spare-parts',name:'Spare Parts'},{id:'oils',name:'Oils'},{id:'automotive-tools',name:'Tools'}]},
{id:'baby-kids',name:'Baby & Kids',iconName:'Baby',color:'',subcategories:[{id:'baby-care',name:'Baby Care'},{id:'toys',name:'Toys'},{id:'school-supplies',name:'School Supplies'}]},
{id:'sports-fitness',name:'Sports & Fitness',iconName:'Dumbbell',color:'',subcategories:[{id:'gym-equipment',name:'Gym Equipment'},{id:'sportswear',name:'Sportswear'},{id:'outdoor-gear',name:'Outdoor Gear'}]},
{id:'industrial-tools',name:'Industrial & Tools',iconName:'Wrench',color:'',subcategories:[{id:'power-tools',name:'Power Tools'},{id:'safety-equipment',name:'Safety Equipment'},{id:'building-materials',name:'Building Materials'}]},
{id:'office-stationery',name:'Office & Stationery',iconName:'Printer',color:'',subcategories:[{id:'office-furniture',name:'Office Furniture'},{id:'paper',name:'Paper'},{id:'printers',name:'Printers'},{id:'office-supplies',name:'Supplies'}]},
{id:'books-media',name:'Books & Media',iconName:'BookOpen',color:'',subcategories:[{id:'books',name:'Books'},{id:'educational-materials',name:'Educational Materials'}]},
{id:'services-digital-products',name:'Services & Digital Products',iconName:'Download',color:'',subcategories:[{id:'gift-cards',name:'Gift Cards'},{id:'e-books',name:'E-Books'}]},
{id:'agriculture-farm',name:'Agriculture & Farm',iconName:'Wheat',color:'',subcategories:[{id:'seeds',name:'Seeds'},{id:'fertilisers',name:'Fertilisers'},{id:'farm-tools',name:'Farm Tools'}]},
{id:'handmade-custom',name:'Handmade & Custom',iconName:'Palette',color:'',subcategories:[{id:'handmade-crafts',name:'Handmade Crafts'},{id:'art',name:'Art'},{id:'custom-prints',name:'Custom Prints'}]},
];
export const CATALOG_BY_ID = Object.fromEntries(TRADEASE_CATALOG.map(c=>[c.id,c]));
export const SUBCATEGORY_BY_ID = Object.fromEntries(TRADEASE_CATALOG.flatMap(c=>c.subcategories.map(s=>[s.id,{...s,categoryId:c.id}])));
