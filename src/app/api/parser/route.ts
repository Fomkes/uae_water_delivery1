import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';

export const runtime = 'nodejs';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

interface ParsedProduct {
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: string;
  categoryAr?: string;
  size?: string;
  sizeAr?: string;
  volume?: string;
  volumeAr?: string;
  origin?: string;
  originAr?: string;
  features: string[];
  featuresAr?: string[];
  rating?: number;
  reviews?: number;
  slug: string;
  sourceUrl: string;
  inStock: boolean;
  stockQuantity: number;
}

const PARSER_CONFIG = {
  timeout: 30000,
  maxRedirects: 5,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  }
};

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
}

function extractPrice(text: string): number {
  const priceMatch = text.match(/(\d+(?:[,\.]\d{2})?)/);
  if (priceMatch) {
    return parseFloat(priceMatch[1].replace(',', '.'));
  }
  return 0;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function detectCategory(name: string): string {
  const nameL = name.toLowerCase();
  if (nameL.includes('sparkling') || nameL.includes('fizzy') || nameL.includes('carbonated')) return 'Sparkling Water';
  if (nameL.includes('alkaline') || nameL.includes('ph')) return 'Alkaline Water';
  if (nameL.includes('family') || nameL.includes('pack') || nameL.includes('bulk')) return 'Family Packs';
  if (nameL.includes('sport') || nameL.includes('electrolyte')) return 'Sports Water';
  if (nameL.includes('vitamin') || nameL.includes('enhanced')) return 'Enhanced Water';
  if (nameL.includes('distilled') || nameL.includes('pure')) return 'Distilled Water';
  return 'Natural Water';
}

function detectCategoryAr(name: string): string {
  const category = detectCategory(name);
  const categoryMap: { [key: string]: string } = {
    'Sparkling Water': 'المياه الفوارة',
    'Alkaline Water': 'المياه القلوية',
    'Family Packs': 'العبوات العائلية',
    'Sports Water': 'مياه رياضية',
    'Enhanced Water': 'المياه المُحسنة',
    'Distilled Water': 'المياه المقطرة',
    'Natural Water': 'المياه الطبيعية'
  };
  return categoryMap[category] || 'المياه الطبيعية';
}

async function fetchPageHTML(url: string): Promise<string> {
  try {
    console.log(`🔍 Fetching: ${url}`);

    const response = await axios.get(url, {
      timeout: PARSER_CONFIG.timeout,
      maxRedirects: PARSER_CONFIG.maxRedirects,
      headers: PARSER_CONFIG.headers,
      validateStatus: (status: number) => status < 400,
    });

    if (!response.data) {
      throw new Error('No HTML content received');
    }

    console.log(`✅ HTML fetched successfully (${response.data.length} chars)`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching HTML from ${url}:`, error);
    throw new Error(`Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function parseCarrefourUAE(html: string, baseUrl: string): Promise<ParsedProduct[]> {
  const $ = cheerio.load(html);
  const products: ParsedProduct[] = [];

  console.log('🏪 Parsing Carrefour UAE...');

  const productSelectors = [
    '.product-item',
    '.product-card',
    '[data-testid="product-card"]',
    '.cs-product-tile',
    '.product-grid-item'
  ];

  let productElements = $();
  for (const selector of productSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      productElements = elements;
      console.log(`Found ${elements.length} products using selector: ${selector}`);
      break;
    }
  }

  productElements.each((index, element) => {
    if (products.length >= 20) return false;

    try {
      const $el = $(element);

      const name = cleanText(
        $el.find('h3, h4, .product-title, .product-name, [data-testid="product-name"]').first().text() ||
        $el.find('a').attr('title') ||
        ''
      );

      if (!name || name.length < 3) return;

      const priceText = $el.find('.price, .product-price, [data-testid="price"]').text();
      const price = extractPrice(priceText);

      if (!price || price <= 0) return;

      const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';
      let imageUrl = '';
      if (imgSrc) {
        imageUrl = imgSrc.startsWith('//') ? `https:${imgSrc}` :
                   imgSrc.startsWith('/') ? `https://www.carrefouruae.com${imgSrc}` : imgSrc;
      }

      const description = cleanText(
        $el.find('.product-description, .product-summary').text() ||
        `High quality ${name.toLowerCase()} from Carrefour UAE`
      );

      const product: ParsedProduct = {
        name,
        nameAr: name,
        description,
        descriptionAr: `${name} عالي الجودة من كارفور الإمارات`,
        price,
        originalPrice: undefined,
        image: imageUrl || '/uploads/products/default-water.jpg',
        images: imageUrl ? [imageUrl] : ['/uploads/products/default-water.jpg'],
        category: detectCategory(name),
        categoryAr: detectCategoryAr(name),
        size: name.match(/(\d+(?:\.\d+)?\s*(?:ml|l|liter|litre))/i)?.[1] || 'Medium',
        sizeAr: 'متوسط',
        volume: name.match(/(\d+(?:\.\d+)?\s*(?:ml|l|liter|litre))/i)?.[1] || '500ml',
        volumeAr: '500 مل',
        origin: 'UAE',
        originAr: 'الإمارات',
        features: ['Natural', 'High Quality', 'BPA Free'],
        featuresAr: ['طبيعي', 'جودة عالية', 'خالي من BPA'],
        rating: 4.5 + Math.random() * 0.5,
        reviews: Math.floor(Math.random() * 100) + 10,
        slug: generateSlug(name),
        sourceUrl: baseUrl,
        inStock: true,
        stockQuantity: Math.floor(Math.random() * 50) + 25
      };

      products.push(product);
    } catch (error) {
      console.error('Error parsing Carrefour product:', error);
    }
  });

  return products;
}

async function parseUniversalSite(html: string, baseUrl: string): Promise<ParsedProduct[]> {
  const $ = cheerio.load(html);
  const products: ParsedProduct[] = [];

  console.log('🔍 Parsing universal site...');

  const productSelectors = [
    '[class*="product"]',
    '[class*="item"]',
    '[data-product]',
    '.card',
    '[class*="tile"]'
  ];

  let productElements = $();
  for (const selector of productSelectors) {
    const elements = $(selector);
    if (elements.length > 0) {
      productElements = elements.slice(0, 20);
      console.log(`Found ${elements.length} elements using selector: ${selector}`);
      break;
    }
  }

  productElements.each((index, element) => {
    try {
      const $el = $(element);

      const nameSelectors = ['h1', 'h2', 'h3', 'h4', '.title', '[class*="name"]', '[class*="title"]'];
      let name = '';
      for (const selector of nameSelectors) {
        name = cleanText($el.find(selector).first().text());
        if (name && name.length > 3) break;
      }

      if (!name || name.length < 3) return;

      const priceSelectors = ['.price', '[class*="price"]', '[class*="cost"]', '[class*="amount"]'];
      let priceText = '';
      for (const selector of priceSelectors) {
        priceText = $el.find(selector).text();
        if (priceText && extractPrice(priceText) > 0) break;
      }

      const price = extractPrice(priceText);
      if (!price || price <= 0) return;

      const imgSrc = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src') || '';
      let imageUrl = '';
      if (imgSrc) {
        if (imgSrc.startsWith('//')) {
          imageUrl = `https:${imgSrc}`;
        } else if (imgSrc.startsWith('/')) {
          const domain = new URL(baseUrl).origin;
          imageUrl = `${domain}${imgSrc}`;
        } else if (imgSrc.startsWith('http')) {
          imageUrl = imgSrc;
        }
      }

      const description = `High quality ${name.toLowerCase()} available online. Premium product for your daily needs.`;

      const product: ParsedProduct = {
        name,
        nameAr: name,
        description,
        descriptionAr: `${name} عالي الجودة متوفر أونلاين. منتج مميز لاحتياجاتك اليومية.`,
        price,
        originalPrice: undefined,
        image: imageUrl || '/uploads/products/default-water.jpg',
        images: imageUrl ? [imageUrl] : ['/uploads/products/default-water.jpg'],
        category: detectCategory(name),
        categoryAr: detectCategoryAr(name),
        size: name.match(/(\d+(?:\.\d+)?\s*(?:ml|l|liter|litre))/i)?.[1] || 'Medium',
        sizeAr: 'متوسط',
        volume: name.match(/(\d+(?:\.\d+)?\s*(?:ml|l|liter|litre))/i)?.[1] || '500ml',
        volumeAr: '500 мл',
        origin: 'UAE',
        originAr: 'الإمارات',
        features: ['Quality Product', 'Online Available'],
        featuresAr: ['منتج عالي الجودة', 'متوفر أونلاين'],
        rating: 4.0 + Math.random() * 1.0,
        reviews: Math.floor(Math.random() * 50) + 5,
        slug: generateSlug(name),
        sourceUrl: baseUrl,
        inStock: true,
        stockQuantity: Math.floor(Math.random() * 30) + 15
      };

      products.push(product);
    } catch (error) {
      console.error('Error parsing product:', error);
    }
  });

  return products;
}

async function parseProductsFromURL(url: string): Promise<ParsedProduct[]> {
  try {
    console.log(`🔍 Starting to parse: ${url}`);

    const html = await fetchPageHTML(url);
    let products: ParsedProduct[] = [];

    if (url.includes('carrefouruae.com') || url.includes('carrefour')) {
      products = await parseCarrefourUAE(html, url);
    } else {
      products = await parseUniversalSite(html, url);
    }

    console.log(`✅ Successfully parsed ${products.length} products`);
    return products;

  } catch (error) {
    console.error('❌ Error in parseProductsFromURL:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, category, maxProducts = 20 } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`🚀 Starting parsing for: ${url}`);

    const products = await parseProductsFromURL(url);

    if (products.length === 0) {
      return NextResponse.json(
        {
          error: 'No products found',
          message: 'Could not extract any products from the provided URL.'
        },
        { status: 404, headers: corsHeaders }
      );
    }

    if (category) {
      products.forEach(product => {
        product.category = category;
        product.categoryAr = detectCategoryAr(category);
      });
    }

    const limitedProducts = products.slice(0, maxProducts);

    console.log(`✅ Successfully parsed ${limitedProducts.length} products from ${url}`);

    return NextResponse.json({
      success: true,
      products: limitedProducts,
      totalFound: products.length,
      source: url,
      timestamp: new Date().toISOString(),
      message: `Successfully parsed ${limitedProducts.length} products`
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('💥 Parser API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to parse products',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
