'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Star, 
  Trash2, 
  ShoppingBag, 
  Grid, 
  List, 
  Sparkles, 
  Plus, 
  RotateCcw,
  Compass,
  Zap,
  Loader2,
  X,
  ArrowDown,
  ArrowUp,
  Package,
  Tag,
  Camera,
  Wand2
} from 'lucide-react';

interface GearItem {
  id: string;
  name: string;
  brand: string;
  type: string;
  depth: string;
  color: string;
  is_favorite: boolean;
  is_ghost: boolean;
  image_url: string;
  species: string[];
}

export default function TackleVault() {
  const [items, setItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'showroom'>('grid');
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: 'Hardbody Suspending',
    depth: '1.5m',
    color: '',
    species: '',
    image_url: ''
  });

  useEffect(() => {
    fetchGearItems();
  }, []);

  const fetchGearItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gear_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gear from Supabase:', error);
    } else if (data) {
      setItems(data as GearItem[]);
    }
    setLoading(false);
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, is_favorite: !currentStatus } : item
    ));

    const { error } = await supabase
      .from('gear_items')
      .update({ is_favorite: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Failed to update favorite status:', error);
      fetchGearItems();
    }
  };

  const toggleGhost = async (id: string, currentStatus: boolean) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, is_ghost: !currentStatus } : item
    ));

    const { error } = await supabase
      .from('gear_items')
      .update({ is_ghost: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Failed to update ghost status:', error);
      fetchGearItems();
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (categoryType: string) => {
    if (activeCategoryFilter === categoryType) {
      setActiveCategoryFilter(null);
    } else {
      setActiveCategoryFilter(categoryType);
      scrollToSection('my-gear-section');
    }
  };

  // Upload Photo to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('tackle-vault-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      alert('Image upload failed. Ensure bucket policies are saved.');
      setIsUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('tackle-vault-images')
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;
    setFormData(prev => ({ ...prev, image_url: publicUrl }));
    setIsUploading(false);

    // Trigger AI Extraction on uploaded photo
    extractMetadataFromImage(publicUrl);
  };

  // AI Extraction Handler
  const extractMetadataFromImage = async (url: string) => {
    setIsExtracting(true);
    try {
      const res = await fetch('/api/extract-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url })
      });
      const result = await res.json();
      if (result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          brand: result.data.brand || prev.brand,
          name: result.data.name || prev.name,
          color: result.data.color || prev.color,
          depth: result.data.depth || prev.depth,
          type: result.data.type || prev.type,
          species: result.data.species ? result.data.species.join(', ') : prev.species
        }));
      }
    } catch (err) {
      console.error('AI extraction error:', err);
    }
    setIsExtracting(false);
  };

  const handleAddLure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brand || !formData.color) return;

    setIsSubmitting(true);
    const speciesArray = formData.species
      ? formData.species.split(',').map(s => s.trim())
      : ['General'];

    const fallbackImage = formData.image_url || 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80';

    const newItem = {
      name: formData.name,
      brand: formData.brand,
      type: formData.type,
      depth: formData.depth,
      color: formData.color,
      is_favorite: false,
      is_ghost: false,
      image_url: fallbackImage,
      species: speciesArray
    };

    const { data, error } = await supabase
      .from('gear_items')
      .insert([newItem])
      .select();

    if (error) {
      console.error('Error inserting new lure:', error);
      alert('Failed to add lure. Please try again.');
    } else if (data) {
      setItems([data[0] as GearItem, ...items]);
      setFormData({
        name: '',
        brand: '',
        type: 'Hardbody Suspending',
        depth: '1.5m',
        color: '',
        species: '',
        image_url: ''
      });
      setIsAddModalOpen(false);
    }

    setIsSubmitting(false);
  };

  const ghostItems = items.filter(item => item.is_ghost);
  const favoriteItems = items.filter(item => item.is_favorite && !item.is_ghost);
  const baseMyGearItems = items.filter(item => !item.is_favorite && !item.is_ghost);
  const myGearItems = activeCategoryFilter
    ? [...baseMyGearItems].sort((a, b) => {
        if (a.type === activeCategoryFilter && b.type !== activeCategoryFilter) return -1;
        if (a.type !== activeCategoryFilter && b.type === activeCategoryFilter) return 1;
        return 0;
      })
    : baseMyGearItems;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-32 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-wide text-slate-100 uppercase">Tackle Vault</h1>
              <p className="text-xs text-slate-400 font-mono">Tracking my gear</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsRestockOpen(true)}
              className="relative p-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition text-slate-300"
              title="Restock List"
            >
              <ShoppingBag className="w-5 h-5" />
              {ghostItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {ghostItems.length}
                </span>
              )}
            </button>

            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                title="Tray Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('showroom')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'showroom' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                title="Showroom View"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                title="List Specs View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 pt-6">
        
        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mb-6 font-mono text-xs">
          <button 
            onClick={() => {
              setActiveCategoryFilter(null);
              if (myGearItems.length > 0) scrollToSection('my-gear-section');
            }}
            className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 group-hover:text-slate-300 block uppercase transition">All my gear</span>
              {myGearItems.length > 0 && <ArrowDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition" />}
            </div>
            <span className="text-lg font-bold text-slate-200">{items.length} Items</span>
          </button>

          <button 
            onClick={() => favoriteItems.length > 0 && scrollToSection('favourites-section')}
            className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3 text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 group-hover:text-amber-400 block uppercase transition">Favourite Items</span>
              {favoriteItems.length > 0 && <ArrowDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition" />}
            </div>
            <span className="text-lg font-bold text-amber-400">{favoriteItems.length} Items</span>
          </button>

          <button 
            onClick={() => ghostItems.length > 0 && scrollToSection('to-replace-section')}
            className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-red-500/40 rounded-xl p-3 text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 group-hover:text-red-400 block uppercase transition">Gear to replace</span>
              {ghostItems.length > 0 && <ArrowDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 transition" />}
            </div>
            <span className="text-lg font-bold text-red-400">{ghostItems.length} Items</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 font-mono text-xs">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <p>Loading your Tackle Vault...</p>
          </div>
        ) : (
          <>
            {/* Tray Grid View */}
            {viewMode === 'grid' && (
              <div className="space-y-8">
                
                {/* Favourites Section */}
                {favoriteItems.length > 0 && (
                  <div id="favourites-section" className="bg-slate-900/40 p-4 rounded-2xl border border-amber-500/20 backdrop-blur-sm shadow-2xl scroll-mt-20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-current" /> Favourites
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{favoriteItems.length} Items</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {favoriteItems.map((item) => (
                        <div 
                          key={item.id}
                          className="relative group rounded-xl p-3 transition-all duration-300 border bg-slate-900 border-amber-500/50 shadow-lg shadow-amber-500/5"
                        >
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 mb-3 border border-slate-800/80">
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            
                            <button 
                              onClick={() => toggleFavorite(item.id, item.is_favorite)}
                              className="absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md border transition bg-amber-500 text-slate-950 border-amber-400 scale-110"
                              title="Unstar Favourite"
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <span>{item.brand}</span>
                              <span className="text-amber-400/80">{item.depth}</span>
                            </div>
                            <h3 className="font-semibold text-sm text-slate-100 truncate">{item.name}</h3>
                            <p className="text-xs text-slate-400">{item.color}</p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            <button 
                              onClick={() => toggleGhost(item.id, item.is_ghost)}
                              className="text-xs font-mono px-2 py-1 rounded transition flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3 h-3" />
                              Gone
                            </button>
                            
                            <button 
                              onClick={() => handleCategoryClick(item.type)}
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded transition border ${
                                activeCategoryFilter === item.type 
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' 
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                              }`}
                            >
                              {item.type}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* My Gear Section */}
                {myGearItems.length > 0 && (
                  <div id="my-gear-section" className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-2xl scroll-mt-20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-slate-400" /> My gear
                        </span>

                        {activeCategoryFilter && (
                          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded-lg">
                            <Tag className="w-3 h-3" />
                            <span>Sorted by: {activeCategoryFilter}</span>
                            <button 
                              onClick={() => setActiveCategoryFilter(null)}
                              className="ml-1 hover:text-slate-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <span className="text-xs text-slate-500 font-mono">{myGearItems.length} Items</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {myGearItems.map((item) => (
                        <div 
                          key={item.id}
                          className={`relative group rounded-xl p-3 transition-all duration-300 border ${
                            activeCategoryFilter === item.type 
                              ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 mb-3 border border-slate-800/80">
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            
                            <button 
                              onClick={() => toggleFavorite(item.id, item.is_favorite)}
                              className="absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md border transition bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200"
                              title="Mark as Favourite"
                            >
                              <Star className="w-3.5 h-3.5 fill-current" />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <span>{item.brand}</span>
                              <span className="text-amber-400/80">{item.depth}</span>
                            </div>
                            <h3 className="font-semibold text-sm text-slate-100 truncate">{item.name}</h3>
                            <p className="text-xs text-slate-400">{item.color}</p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            <button 
                              onClick={() => toggleGhost(item.id, item.is_ghost)}
                              className="text-xs font-mono px-2 py-1 rounded transition flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3 h-3" />
                              Gone
                            </button>
                            
                            <button 
                              onClick={() => handleCategoryClick(item.type)}
                              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded transition border ${
                                activeCategoryFilter === item.type 
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' 
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-slate-200'
                              }`}
                            >
                              {item.type}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items To Replace Section */}
                {ghostItems.length > 0 && (
                  <div id="to-replace-section" className="bg-slate-950/80 p-4 rounded-2xl border border-red-500/20 backdrop-blur-sm scroll-mt-20">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-red-400 font-mono flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4" /> Items to replace
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{ghostItems.length} Items</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {ghostItems.map((item) => (
                        <div 
                          key={item.id}
                          className="relative group rounded-xl p-3 transition-all duration-300 border bg-slate-950/60 border-dashed border-red-500/40 opacity-70 hover:opacity-100"
                        >
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 mb-3 border border-slate-800/80">
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-cover grayscale opacity-40 blur-[1px]"
                            />
                            
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-[2px]">
                              <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono uppercase px-2 py-1 rounded font-bold tracking-widest">
                                Gone
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <span>{item.brand}</span>
                              <span className="text-amber-400/80">{item.depth}</span>
                            </div>
                            <h3 className="font-semibold text-sm text-slate-100 truncate">{item.name}</h3>
                            <p className="text-xs text-slate-400">{item.color}</p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            <button 
                              onClick={() => toggleGhost(item.id, item.is_ghost)}
                              className="text-xs font-mono px-2 py-1 rounded transition flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Replaced
                            </button>
                            
                            <span className="text-[10px] font-mono text-slate-500 uppercase">{item.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* Showroom View */}
            {viewMode === 'showroom' && (
              <div className="bg-black p-8 rounded-2xl border border-slate-800 min-h-[400px] flex flex-col items-center justify-center">
                <div className="text-center mb-8">
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-500">Showroom Presentation</span>
                  <h2 className="text-2xl font-bold text-slate-100">The Favourites Collection</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                  {favoriteItems.map((item) => (
                    <div key={item.id} className="group relative flex flex-col items-center">
                      <div className="w-full aspect-square rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4 flex items-center justify-center group-hover:border-amber-500/40 transition">
                        <img 
                          src={item.image_url} 
                          alt={item.name} 
                          className="max-h-full max-w-full object-contain filter drop-shadow-[0_10px_8px_rgba(0,0,0,0.8)] group-hover:scale-110 transition duration-300"
                        />
                      </div>
                      <span className="mt-3 text-xs font-semibold text-slate-300">{item.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{item.brand}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Running Depth</th>
                      <th className="p-3">Colorway</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3 font-sans font-semibold text-slate-200">{item.brand} - {item.name}</td>
                        <td className="p-3 text-slate-400">{item.type}</td>
                        <td className="p-3 text-amber-400">{item.depth}</td>
                        <td className="p-3 text-slate-400">{item.color}</td>
                        <td className="p-3">
                          {item.is_ghost ? (
                            <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Gone</span>
                          ) : item.is_favorite ? (
                            <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Favourite</span>
                          ) : (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">In Vault</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Return To Top */}
            <div className="mt-12 flex justify-center">
              <button 
                onClick={scrollToTop}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 px-5 py-2.5 rounded-xl font-mono text-xs flex items-center gap-2 transition"
              >
                <ArrowUp className="w-4 h-4 text-amber-400" />
                Return to top
              </button>
            </div>
          </>
        )}

      </main>

      {/* Floating Add Button */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-amber-500 hover:bg-amber-400 text-slate-950 p-4 rounded-2xl shadow-xl shadow-amber-500/20 font-bold flex items-center gap-2 transition hover:scale-105 active:scale-95"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
        <span className="hidden sm:inline font-sans uppercase text-xs tracking-wider">Add Lure</span>
      </button>

      {/* Add Lure Modal with Camera Upload & AI Extraction */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-lg text-slate-100">Log New Gear to Vault</h2>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLure} className="mt-4 space-y-4 text-xs font-mono">
              
              {/* Photo Camera Upload & AI Scan Section */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                <label className="block text-slate-400 font-bold uppercase text-[10px]">Camera Capture & AI Metadata Auto-Fill</label>
                
                {formData.image_url ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-amber-500/40 group">
                    <img src={formData.image_url} alt="Uploaded gear" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute top-2 right-2 bg-slate-900/80 text-slate-300 p-1 rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                    ) : isExtracting ? (
                      <div className="flex items-center gap-2 text-amber-400 animate-pulse">
                        <Wand2 className="w-6 h-6" />
                        <span>AI Vision Analyzing Gear Photo...</span>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-amber-400" />
                        <span className="text-slate-300 font-semibold">Snap Photo or Select Image</span>
                        <span className="text-[10px] text-slate-500">Auto-uploads to Supabase Storage & AI extracts specs</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleImageUpload}
                      disabled={isUploading || isExtracting}
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 uppercase">Brand Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Megabass / Shimano" 
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 uppercase">Lure / Gear Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Vision 110" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 uppercase">Colorway *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Eleking" 
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 uppercase">Running Depth / Spec</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1.2m, Surface, 20lb" 
                    value={formData.depth}
                    onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 uppercase">Gear Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  >
                    <option value="Hardbody Suspending">Hardbody Suspending</option>
                    <option value="Soft Plastic">Soft Plastic</option>
                    <option value="Topwater / Surface">Topwater / Surface</option>
                    <option value="Jerkbait">Jerkbait</option>
                    <option value="Metal Jig">Metal Jig</option>
                    <option value="Vibe / Blade">Vibe / Blade</option>
                    <option value="Reel">Reel</option>
                    <option value="Rod">Rod</option>
                    <option value="Terminal tackle">Terminal tackle</option>
                    <option value="Tool">Tool</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 uppercase">Species (Comma Separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Bass, Bream, Flathead" 
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || isUploading || isExtracting}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-4"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Save to Supabase Vault</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Restock List Drawer */}
      {isRestockOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-lg text-slate-100">Restock Radar</h2>
              </div>
              <button 
                onClick={() => setIsRestockOpen(false)}
                className="text-slate-400 hover:text-slate-200 font-mono text-xs bg-slate-800 px-2 py-1 rounded"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {ghostItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-mono text-xs">
                  <p>Zero items to replace.</p>
                  <p className="mt-1">Tap "Gone" on any item to build your shopping list!</p>
                </div>
              ) : (
                ghostItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase">{item.brand}</span>
                      <h4 className="font-semibold text-sm text-slate-200">{item.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">Color: {item.color} | {item.depth}</p>
                    </div>
                    <button 
                      onClick={() => toggleGhost(item.id, item.is_ghost)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono px-3 py-1.5 rounded-lg transition"
                    >
                      Replaced
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 font-mono text-xs text-slate-400">
              <div className="flex justify-between mb-2">
                <span>Items to Buy:</span>
                <span className="text-slate-200 font-bold">{ghostItems.length} Items</span>
              </div>
              <button 
                onClick={() => alert('Restock list copied to clipboard for tackle shop run!')}
                disabled={ghostItems.length === 0}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-sans font-bold py-2.5 rounded-xl transition"
              >
                Export Tackle Shop List
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}