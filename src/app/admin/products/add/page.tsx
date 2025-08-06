'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const categories = [
  'Natural Water',
  'Sparkling Water', 
  'Alkaline Water',
  'Family Packs',
  'Sports Water',
  'Enhanced Water',
  'Distilled Water'
];

export default function AddProductPage() {
  const [product, setProduct] = useState({
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    category: '',
    price: '',
    originalPrice: '',
    volume: '',
    origin: 'UAE',
    image: '/uploads/products/default-water.jpg',
    inStock: true,
    stockQuantity: '50'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: product.name,
          name_ar: product.nameAr || product.name,
          description: product.description,
          description_ar: product.descriptionAr || product.description,
          category: product.category,
          category_ar: product.category,
          price: parseFloat(product.price),
          original_price: product.originalPrice ? parseFloat(product.originalPrice) : null,
          volume: product.volume,
          origin: product.origin,
          origin_ar: 'الإمارات',
          image: product.image,
          images: [product.image],
          in_stock: product.inStock,
          stock_quantity: parseInt(product.stockQuantity),
          rating: 4.5,
          reviews: Math.floor(Math.random() * 100) + 10,
          features: ['High Quality', 'Natural', 'BPA Free'],
          features_ar: ['جودة عالية', 'طبيعي', 'خالي من BPA'],
          size: 'Medium',
          size_ar: 'متوسط',
          volume_ar: product.volume,
          slug: product.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          popular: false
        }]);

      if (error) throw error;

      alert('✅ Товар успешно добавлен!');
      
      // Очищаем форму
      setProduct({
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        category: '',
        price: '',
        originalPrice: '',
        volume: '',
        origin: 'UAE',
        image: '/uploads/products/default-water.jpg',
        inStock: true,
        stockQuantity: '50'
      });

    } catch (error) {
      console.error('Error adding product:', error);
      alert('❌ Ошибка при добавлении товара');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🆕 Добавить новый товар</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Название */}
              <div>
                <Label htmlFor="name">Название (English)</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) => setProduct({...product, name: e.target.value})}
                  placeholder="Premium Natural Water"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="nameAr">Название (العربية)</Label>
                <Input
                  id="nameAr"
                  value={product.nameAr}
                  onChange={(e) => setProduct({...product, nameAr: e.target.value})}
                  placeholder="المياه الطبيعية المميزة"
                />
              </div>

              {/* Категория */}
              <div>
                <Label htmlFor="category">Категория</Label>
                <Select value={product.category} onValueChange={(value) => setProduct({...product, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Цена */}
              <div>
                <Label htmlFor="price">Цена (AED)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={product.price}
                  onChange={(e) => setProduct({...product, price: e.target.value})}
                  placeholder="25.99"
                  required
                />
              </div>

              {/* Старая цена */}
              <div>
                <Label htmlFor="originalPrice">Старая цена (опционально)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  step="0.01"
                  value={product.originalPrice}
                  onChange={(e) => setProduct({...product, originalPrice: e.target.value})}
                  placeholder="35.99"
                />
              </div>

              {/* Объем */}
              <div>
                <Label htmlFor="volume">Объем</Label>
                <Input
                  id="volume"
                  value={product.volume}
                  onChange={(e) => setProduct({...product, volume: e.target.value})}
                  placeholder="500ml"
                />
              </div>

              {/* Происхождение */}
              <div>
                <Label htmlFor="origin">Происхождение</Label>
                <Input
                  id="origin"
                  value={product.origin}
                  onChange={(e) => setProduct({...product, origin: e.target.value})}
                  placeholder="UAE"
                />
              </div>

              {/* Количество */}
              <div>
                <Label htmlFor="stockQuantity">Количество на складе</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={product.stockQuantity}
                  onChange={(e) => setProduct({...product, stockQuantity: e.target.value})}
                  placeholder="50"
                />
              </div>
            </div>

            {/* Описание */}
            <div>
              <Label htmlFor="description">Описание (English)</Label>
              <Textarea
                id="description"
                value={product.description}
                onChange={(e) => setProduct({...product, description: e.target.value})}
                placeholder="High quality natural water perfect for daily hydration..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="descriptionAr">Описание (العربية)</Label>
              <Textarea
                id="descriptionAr"
                value={product.descriptionAr}
                onChange={(e) => setProduct({...product, descriptionAr: e.target.value})}
                placeholder="مياه طبيعية عالية الجودة مثالية للترطيب اليومي..."
                rows={3}
              />
            </div>

            {/* URL изображения */}
            <div>
              <Label htmlFor="image">URL изображения</Label>
              <Input
                id="image"
                value={product.image}
                onChange={(e) => setProduct({...product, image: e.target.value})}
                placeholder="/uploads/products/water-bottle.jpg"
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Добавление...' : '✅ Добавить товар'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
