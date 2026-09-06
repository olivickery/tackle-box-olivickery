'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { VaultIcon } from './components/VaultIcon';
import { 
  Star, 
  Trash2, 
  ShoppingBag, 
  Grid, 
  List, 
  Sparkles, 
  Plus, 
  Loader2,
  X,
  ArrowDown,
  ArrowUp,
  Package,
  Tag,
  Camera,
  Wand2,
  Repeat,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Filter,
  Check
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
  image_urls: string[];
  notes?: string;
  species: string[];
}

// Sub-component for Multi-Slide Carousel per Card
function CardCarousel({ 
  item, 
  onEditNotes,
  onEditSpecs,
  onToggleFavorite,
  onDeleteItem
}: { 
  item: GearItem;
  onEditNotes: (item: GearItem) => void;
  onEditSpecs: (item: GearItem) => void;
  onToggleFavorite: (id: string, currentStatus: boolean) => void;
  onDeleteItem: (item: GearItem) => void;
}) {
  const images = item.image_urls && item.image_urls.length > 0 
    ? item.image_urls 
    : [item.image_url];
  
  const totalSlides = images.length + 2;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Touch Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 40;

  const prevSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const nextSlide = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const isSpecsSlide = currentIndex === images.length;
  const isNotesSlide = currentIndex === images.length + 1;
  const isFirstSlide = currentIndex === 0;

  const displaySpec = item.depth && item.depth !== 'N/A' ? item.depth : '';

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 mb-3 border border-slate-800/80 group select-none"
    >
      
      {/* Favourite Star Button - Slide 1 Only */}
      {isFirstSlide && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id, item.is_favorite);
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md border transition z-20 ${
            item.is_favorite 
              ? 'bg-amber-500 text-slate-950 border-amber-400 scale-110' 
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
          title={item.is_favorite ? "Unstar Favourite" : "Mark as Favourite"}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
        </button>
      )}

      {/* Slide Content */}
      {isSpecsSlide ? (
        /* SPECS SLIDE (With Edit Specs Button) */
        <div className="w-full h-full p-3 bg-slate-900/95 flex flex-col justify-between font-mono text-xs overflow-y-auto">
          <div>
            <div className="h-6 flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-100 uppercase font-bold tracking-wider leading-none">
                Specs
              </span>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEditSpecs(item);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 transition z-20"
              >
                <Edit3 className="w-3 h-3 text-slate-100" />
                <span>Edit Specs</span>
              </button>
            </div>

            <div className="space-y-1.5 text-[11px] pt-1">
              <p><span className="text-slate-500">Brand:</span> <span className="text-slate-100">{item.brand}</span></p>
              <p><span className="text-slate-500">Name:</span> <span className="text-slate-100">{item.name}</span></p>
              <p><span className="text-slate-500">Colour:</span> <span className="text-slate-100">{item.color}</span></p>
              {displaySpec && <p><span className="text-slate-500">Specs:</span> <span className="text-slate-100">{displaySpec}</span></p>}
              <p><span className="text-slate-500">Type:</span> <span className="text-slate-100">{item.type}</span></p>
              <p><span className="text-slate-500">Species:</span> <span className="text-slate-100">{item.species.join(', ')}</span></p>
            </div>
          </div>

          <div className="text-[8px] text-slate-500 text-center uppercase tracking-widest pb-1">
            Swipe for Notes
          </div>
        </div>
      ) : isNotesSlide ? (
        /* NOTES SLIDE (Delete Button with 'Delete item' title) */
        <div className="w-full h-full p-3 bg-slate-900/95 flex flex-col justify-between font-mono text-xs overflow-y-auto relative">
          <div>
            {/* Header Row */}
            <div className="h-6 flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-100 uppercase font-bold tracking-wider leading-none">
                Notes
              </span>
              
              {/* Delete Trash Button with 'Delete item' Title */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item);
                }}
                className="px-2 py-1 rounded-lg backdrop-blur-md transition bg-slate-900/80 text-red-400 border border-slate-700 hover:bg-red-500 hover:text-white z-20 flex items-center gap-1 text-[10px] font-mono"
                title="Delete Item Permanently"
              >
                <span>Delete item</span>
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Notes Display Box */}
            <div className="pt-1">
              <div className="text-slate-100 text-[11px] leading-relaxed italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 min-h-[85px] w-full">
                {item.notes ? item.notes : <span className="text-slate-500 non-italic">No custom notes logged yet. Tap Edit below to add notes!</span>}
              </div>

              {/* Edit Button Sitting Under Notes Field on Right Hand Side */}
              <div className="flex justify-end mt-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditNotes(item);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-2.5 py-1 rounded text-[10px] flex items-center gap-1 transition z-20"
                >
                  <Edit3 className="w-3 h-3 text-slate-100" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-[8px] text-slate-500 text-center uppercase tracking-widest pb-1">
            Swipe or tap arrows
          </div>
        </div>
      ) : (
        /* PHOTO SLIDES */
        <img 
          src={images[currentIndex]} 
          alt={`${item.name} slide ${currentIndex + 1}`} 
          className="w-full h-full object-cover transition duration-500 pointer-events-none"
        />
      )}

      {/* Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="hidden sm:block absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-950/80 text-slate-200 border border-slate-700/60 shadow-md opacity-0 group-hover:opacity-100 active:scale-95 transition z-10"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={nextSlide}
            className="hidden sm:block absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-slate-950/80 text-slate-200 border border-slate-700/60 shadow-md opacity-0 group-hover:opacity-100 active:scale-95 transition z-10"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {/* Navigation Dots Indicator Bar */}
      <div className="absolute bottom-1.5 inset-x-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <span 
              key={idx} 
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === idx ? 'w-3 bg-amber-400' : 'w-1.5 bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

    </div>
  );
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
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  
  // Filter States
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [activeBrandFilter, setActiveBrandFilter] = useState<string | null>(null);

  // Deletion Modal State
  const [itemToDelete, setItemToDelete] = useState<GearItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Notes Modal State
  const [itemToEditNotes, setItemToEditNotes] = useState<GearItem | null>(null);
  const [editedNotes, setEditedNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Edit Specs Modal State
  const [itemToEditSpecs, setItemToEditSpecs] = useState<GearItem | null>(null);
  const [editedSpecs, setEditedSpecs] = useState({
    brand: '',
    name: '',
    color: '',
    depth: '',
    type: 'Hardbody Suspending',
    species: ''
  });
  const [isSavingSpecs, setIsSavingSpecs] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: 'Hardbody Suspending',
    depth: '',
    color: '',
    species: '',
    notes: '',
    image_urls: [] as string[]
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
      const formattedItems = data.map((item: any) => ({
        ...item,
        image_urls: item.image_urls && item.image_urls.length > 0 ? item.image_urls : [item.image_url]
      }));
      setItems(formattedItems as GearItem[]);
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

  const confirmPermanentDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from('gear_items')
      .delete()
      .eq('id', itemToDelete.id);

    if (error) {
      console.error('Failed to delete item from Supabase:', error);
      alert('Could not delete item. Check Supabase RLS delete permissions.');
    } else {
      setItems(items.filter(item => item.id !== itemToDelete.id));
      setItemToDelete(null);
    }
    setIsDeleting(false);
  };

  const openNotesEditor = (item: GearItem) => {
    setItemToEditNotes(item);
    setEditedNotes(item.notes || '');
  };

  const saveUpdatedNotes = async () => {
    if (!itemToEditNotes) return;
    setIsSavingNotes(true);

    const { error } = await supabase
      .from('gear_items')
      .update({ notes: editedNotes })
      .eq('id', itemToEditNotes.id);

    if (error) {
      console.error('Failed to update notes:', error);
      alert('Could not update notes.');
    } else {
      setItems(items.map(item => 
        item.id === itemToEditNotes.id ? { ...item, notes: editedNotes } : item
      ));
      setItemToEditNotes(null);
    }
    setIsSavingNotes(false);
  };

  // Specs Edit Handlers
  const openSpecsEditor = (item: GearItem) => {
    setItemToEditSpecs(item);
    setEditedSpecs({
      brand: item.brand,
      name: item.name,
      color: item.color,
      depth: item.depth || '',
      type: item.type,
      species: item.species.join(', ')
    });
  };

  const saveUpdatedSpecs = async () => {
    if (!itemToEditSpecs) return;
    setIsSavingSpecs(true);

    const speciesArray = editedSpecs.species
      ? editedSpecs.species.split(',').map(s => s.trim())
      : ['General'];

    const updatedData = {
      brand: editedSpecs.brand,
      name: editedSpecs.name,
      color: editedSpecs.color,
      depth: editedSpecs.depth,
      type: editedSpecs.type,
      species: speciesArray
    };

    const { error } = await supabase
      .from('gear_items')
      .update(updatedData)
      .eq('id', itemToEditSpecs.id);

    if (error) {
      console.error('Failed to update specs:', error);
      alert('Could not update specs.');
    } else {
      setItems(items.map(item => 
        item.id === itemToEditSpecs.id ? { ...item, ...updatedData } : item
      ));
      setItemToEditSpecs(null);
    }
    setIsSavingSpecs(false);
  };

  // Clipboard Export Handler
  const handleExportRestockList = async () => {
    if (ghostItems.length === 0) return;

    const listText = ghostItems.map((item, index) => 
      `${index + 1}. ${item.brand} - ${item.name} (${item.color}${item.depth && item.depth !== 'N/A' ? `, ${item.depth}` : ''})`
    ).join('\n');

    const formattedExport = `TACKLE VAULT restock list:\n${listText}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(formattedExport);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = formattedExport;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 3000);
    } catch (err) {
      console.error('Failed to write to clipboard:', err);
      alert('Could not copy automatically. Check browser clipboard permissions.');
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

  const handleBrandClick = (brandName: string) => {
    if (activeBrandFilter === brandName) {
      setActiveBrandFilter(null);
    } else {
      setActiveBrandFilter(brandName);
      scrollToSection('my-gear-section');
    }
  };

  // Upload Multi-Photos
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setExtractionError(null);

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
    
    const updatedUrls = [...formData.image_urls, publicUrl];
    setFormData(prev => ({ ...prev, image_urls: updatedUrls }));
    setIsUploading(false);

    if (updatedUrls.length === 1) {
      extractMetadataFromImage(publicUrl);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const pinAsHero = (indexToPin: number) => {
    setFormData(prev => {
      const selectedImage = prev.image_urls[indexToPin];
      const remainingImages = prev.image_urls.filter((_, idx) => idx !== indexToPin);
      return {
        ...prev,
        image_urls: [selectedImage, ...remainingImages]
      };
    });
  };

  // AI Extraction Handler
  const extractMetadataFromImage = async (url: string) => {
    if (!url) return;
    setIsExtracting(true);
    setExtractionError(null);

    try {
      const res = await fetch('/api/extract-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url })
      });

      const result = await res.json();

      if (res.ok && result.success && result.data) {
        setFormData(prev => ({
          ...prev,
          brand: result.data.brand || prev.brand,
          name: result.data.name || prev.name,
          color: result.data.color || prev.color,
          depth: result.data.depth || prev.depth,
          type: result.data.type || prev.type,
          species: result.data.species ? result.data.species.join(', ') : prev.species
        }));
      } else {
        const errorMsg = result.error || 'AI Extraction returned no data';
        console.error('AI Extraction Error:', errorMsg);
        setExtractionError(errorMsg);
      }
    } catch (err: any) {
      console.error('AI extraction call failed:', err);
      setExtractionError(err?.message || 'Network error executing AI scan');
    }
    setIsExtracting(false);
  };

  // Save Item Handler
  const handleAddLure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brand || !formData.color) return;

    setIsSubmitting(true);
    const speciesArray = formData.species
      ? formData.species.split(',').map(s => s.trim())
      : ['General'];

    const fallbackImage = formData.image_urls[0] || 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80';
    const finalImageUrls = formData.image_urls.length > 0 ? formData.image_urls : [fallbackImage];

    const newItem = {
      name: formData.name,
      brand: formData.brand,
      type: formData.type,
      depth: formData.depth || '',
      color: formData.color,
      is_favorite: false,
      is_ghost: false,
      image_url: fallbackImage,
      image_urls: finalImageUrls,
      notes: formData.notes || '',
      species: speciesArray
    };

    const { data, error } = await supabase
      .from('gear_items')
      .insert([newItem])
      .select();

    if (error) {
      console.error('Error inserting new lure:', error);
      alert(`Failed to add lure: ${error.message}`);
    } else if (data && data[0]) {
      const insertedItem = {
        ...data[0],
        image_urls: data[0].image_urls && data[0].image_urls.length > 0 ? data[0].image_urls : [data[0].image_url]
      } as GearItem;

      setItems([insertedItem, ...items]);
      setFormData({
        name: '',
        brand: '',
        type: 'Hardbody Suspending',
        depth: '',
        color: '',
        species: '',
        notes: '',
        image_urls: []
      });
      setIsAddModalOpen(false);
    }

    setIsSubmitting(false);
  };

  const ghostItems = items.filter(item => item.is_ghost);
  const favoriteItems = items.filter(item => item.is_favorite && !item.is_ghost);
  const baseMyGearItems = items.filter(item => !item.is_favorite && !item.is_ghost);

  const myGearItems = baseMyGearItems.filter(item => {
    const matchesCategory = activeCategoryFilter ? item.type === activeCategoryFilter : true;
    const matchesBrand = activeBrandFilter ? item.brand === activeBrandFilter : true;
    return matchesCategory && matchesBrand;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-32 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-amber-500/10 border border-amber-500/20 p-1">
              <VaultIcon className="w-full h-full object-contain filter invert" />
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
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 font-mono text-[10px] sm:text-xs">
          <button 
            onClick={() => {
              setActiveCategoryFilter(null);
              setActiveBrandFilter(null);
              if (myGearItems.length > 0) scrollToSection('my-gear-section');
            }}
            className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 sm:p-3 text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 group-hover:text-slate-300 block uppercase transition text-[9px] sm:text-[10px] truncate">All my gear</span>
              {myGearItems.length > 0 && <ArrowDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition shrink-0 ml-1" />}
            </div>
            <span className="text-sm sm:text-base font-bold text-slate-200 whitespace-nowrap block mt-1">{items.length} Items</span>
          </button>

          <button 
            onClick={() => favoriteItems.length > 0 && scrollToSection('favourites-section')}
            className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-2.5 sm:p-3 text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 group-hover:text-amber-400 block uppercase transition text-[9px] sm:text-[10px] truncate">Favourites</span>
              {favoriteItems.length > 0 && <ArrowDown className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition shrink-0 ml-1" />}
            </div>
            <span className="text-sm sm:text-base font-bold text-amber-400 whitespace-nowrap block mt-1">{favoriteItems.length} Items</span>
          </button>

          <button 
            onClick={() => ghostItems.length > 0 && scrollToSection('to-replace-section')}
            className="bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-red-500/40 rounded-xl p-2.5 sm:p-3 text-left transition group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-500 group-hover:text-red-400 block uppercase transition text-[9px] sm:text-[10px] truncate">To replace</span>
              {ghostItems.length > 0 && <ArrowDown className="w-3 h-3 text-slate-500 group-hover:text-red-400 transition shrink-0 ml-1" />}
            </div>
            <span className="text-sm sm:text-base font-bold text-red-400 whitespace-nowrap block mt-1">{ghostItems.length} Items</span>
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
                          <div className="relative">
                            <CardCarousel 
                              item={item} 
                              onEditNotes={openNotesEditor} 
                              onEditSpecs={openSpecsEditor}
                              onToggleFavorite={toggleFavorite}
                              onDeleteItem={setItemToDelete}
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <button 
                                onClick={() => handleBrandClick(item.brand)} 
                                className="hover:text-amber-400 transition"
                              >
                                {item.brand}
                              </button>
                              <span className="text-slate-100 font-bold">{item.depth && item.depth !== 'N/A' ? item.depth : ''}</span>
                            </div>
                            <h3 className="font-semibold text-sm text-slate-100 truncate">{item.name}</h3>
                            <p className="text-xs text-slate-400">{item.color}</p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            <button 
                              onClick={() => toggleGhost(item.id, item.is_ghost)}
                              className="text-[10px] font-mono uppercase px-2 py-0.5 rounded transition border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 flex items-center gap-1"
                            >
                              <Repeat className="w-3 h-3" />
                              Replace
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
                {baseMyGearItems.length > 0 && (
                  <div id="my-gear-section" className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-2xl scroll-mt-20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-slate-400" /> My gear
                        </span>

                        {activeCategoryFilter && (
                          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded-lg">
                            <Tag className="w-3 h-3" />
                            <span>Category: {activeCategoryFilter}</span>
                            <button 
                              onClick={() => setActiveCategoryFilter(null)}
                              className="ml-1 hover:text-slate-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {activeBrandFilter && (
                          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono px-2 py-0.5 rounded-lg">
                            <Filter className="w-3 h-3" />
                            <span>Brand: {activeBrandFilter}</span>
                            <button 
                              onClick={() => setActiveBrandFilter(null)}
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
                            activeCategoryFilter === item.type || activeBrandFilter === item.brand
                              ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="relative">
                            <CardCarousel 
                              item={item} 
                              onEditNotes={openNotesEditor} 
                              onEditSpecs={openSpecsEditor}
                              onToggleFavorite={toggleFavorite}
                              onDeleteItem={setItemToDelete}
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <button 
                                onClick={() => handleBrandClick(item.brand)} 
                                className="hover:text-amber-400 transition"
                              >
                                {item.brand}
                              </button>
                              <span className="text-slate-100 font-bold">{item.depth && item.depth !== 'N/A' ? item.depth : ''}</span>
                            </div>
                            <h3 className="font-semibold text-sm text-slate-100 truncate">{item.name}</h3>
                            <p className="text-xs text-slate-400">{item.color}</p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            <button 
                              onClick={() => toggleGhost(item.id, item.is_ghost)}
                              className="text-[10px] font-mono uppercase px-2 py-0.5 rounded transition border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 flex items-center gap-1"
                            >
                              <Repeat className="w-3 h-3" />
                              Replace
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
                        <Repeat className="w-4 h-4" /> Items to replace
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{ghostItems.length} Items</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {ghostItems.map((item) => (
                        <div 
                          key={item.id}
                          className="relative group rounded-xl p-3 transition-all duration-300 border bg-slate-950/60 border-dashed border-red-500/40"
                        >
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 mb-3 border border-slate-800/80">
                            <img 
                              src={item.image_urls?.[0] || item.image_url} 
                              alt={item.name} 
                              className="w-full h-full object-cover opacity-70"
                            />

                            <button 
                              onClick={() => setItemToDelete(item)}
                              className="absolute top-2 left-2 p-1.5 rounded-full backdrop-blur-md transition bg-slate-900/80 text-red-400 border border-slate-700 hover:bg-red-500 hover:text-white hover:border-red-500 z-10"
                              title="Delete Item Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[1px]">
                              <span className="bg-red-500/30 text-red-300 border border-red-500/50 text-[10px] font-mono uppercase px-2 py-1 rounded font-bold tracking-widest backdrop-blur-sm">
                                Needs Replacement
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                              <span>{item.brand}</span>
                              <span className="text-slate-100 font-bold">{item.depth && item.depth !== 'N/A' ? item.depth : ''}</span>
                            </div>
                            <h3 className="font-semibold text-sm text-slate-100 truncate">{item.name}</h3>
                            <p className="text-xs text-slate-400">{item.color}</p>
                          </div>

                          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                            <button 
                              onClick={() => toggleGhost(item.id, item.is_ghost)}
                              className="text-[10px] font-mono uppercase px-2 py-0.5 rounded transition border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 flex items-center gap-1"
                            >
                              <Repeat className="w-3 h-3" />
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
                          src={item.image_urls?.[0] || item.image_url} 
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
                      <th className="p-3">Gear Specs</th>
                      <th className="p-3">Colourway</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3 font-sans font-semibold text-slate-200">{item.brand} - {item.name}</td>
                        <td className="p-3 text-slate-400">{item.type}</td>
                        <td className="p-3 text-slate-100">{item.depth && item.depth !== 'N/A' ? item.depth : ''}</td>
                        <td className="p-3 text-slate-400">{item.color}</td>
                        <td className="p-3">
                          {item.is_ghost ? (
                            <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Needs Replacement</span>
                          ) : item.is_favorite ? (
                            <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Favourite</span>
                          ) : (
                            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">In Vault</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Edit Specs Modal */}
      {itemToEditSpecs && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">Edit Item Specs</h3>
              </div>
              <button 
                onClick={() => setItemToEditSpecs(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 uppercase text-[10px]">Brand *</label>
                  <input 
                    type="text" 
                    required
                    value={editedSpecs.brand}
                    onChange={(e) => setEditedSpecs({ ...editedSpecs, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 uppercase text-[10px]">Item name *</label>
                  <input 
                    type="text" 
                    required
                    value={editedSpecs.name}
                    onChange={(e) => setEditedSpecs({ ...editedSpecs, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 uppercase text-[10px]">Colourway *</label>
                  <input 
                    type="text" 
                    required
                    value={editedSpecs.color}
                    onChange={(e) => setEditedSpecs({ ...editedSpecs, color: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 uppercase text-[10px]">Gear Specs</label>
                  <input 
                    type="text" 
                    value={editedSpecs.depth}
                    onChange={(e) => setEditedSpecs({ ...editedSpecs, depth: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 uppercase text-[10px]">Category</label>
                  <select 
                    value={editedSpecs.type}
                    onChange={(e) => setEditedSpecs({ ...editedSpecs, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-amber-500 outline-none"
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
                  <label className="block text-slate-400 mb-1 uppercase text-[10px]">Species</label>
                  <input 
                    type="text" 
                    value={editedSpecs.species}
                    onChange={(e) => setEditedSpecs({ ...editedSpecs, species: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  onClick={() => setItemToEditSpecs(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveUpdatedSpecs}
                  disabled={isSavingSpecs}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  {isSavingSpecs ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Specs</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {itemToEditNotes && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">Edit Custom Notes</h3>
              </div>
              <button 
                onClick={() => setItemToEditNotes(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <p className="text-slate-400">
                Updating notes for <span className="text-slate-200 font-bold">{itemToEditNotes.brand} - {itemToEditNotes.name}</span>:
              </p>

              <textarea 
                rows={4}
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Log hook sizes, leader line recommendations, brackish water action, or field tests..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none resize-none leading-relaxed"
              />

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setItemToEditNotes(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveUpdatedNotes}
                  disabled={isSavingNotes}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  {isSavingNotes ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Notes</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl relative text-center">
            
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-100">Permanently delete item?</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              You are about to remove <span className="text-slate-200 font-bold">{itemToDelete.brand} - {itemToDelete.name}</span> from your vault.
            </p>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 my-4 font-mono text-[11px] text-red-400">
              ⚠️ <strong>Disclaimer:</strong> Once it's gone, it's gone! This action cannot be undone.
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs py-2.5 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={confirmPermanentDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-sans font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Add Button */}
      <button 
        onClick={() => {
          setExtractionError(null);
          setIsAddModalOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 bg-amber-500 hover:bg-amber-400 text-slate-950 p-4 rounded-2xl shadow-xl shadow-amber-500/20 font-bold flex items-center gap-2 transition hover:scale-105 active:scale-95"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
        <span className="hidden sm:inline font-sans uppercase text-xs tracking-wider">Add Lure</span>
      </button>

      {/* Add New Gear Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h2 className="font-bold text-lg text-slate-100">Add new gear</h2>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLure} className="mt-4 space-y-4 text-xs font-mono">
              
              {/* Multi-Photo Camera Strip */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-bold uppercase text-[10px]">
                    Photos ({formData.image_urls.length}/4)
                  </label>
                  <span className="text-[9px] text-amber-400">Photo #1 triggers AI Scan</span>
                </div>

                {/* Uploaded Thumbnails Grid */}
                {formData.image_urls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {formData.image_urls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-amber-500/40 group">
                        <img src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                        
                        <button 
                          type="button" 
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-slate-900/80 text-red-400 p-1 rounded z-10 hover:bg-red-500 hover:text-white transition"
                          title="Remove Photo"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {idx === 0 ? (
                          <span className="absolute bottom-1 left-1 right-1 bg-amber-500 text-slate-950 text-[8px] font-bold py-0.5 rounded text-center shadow">
                            ★ HERO COVER
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => pinAsHero(idx)}
                            className="absolute bottom-1 left-1 right-1 bg-slate-900/90 hover:bg-amber-500 text-slate-300 hover:text-slate-950 text-[8px] font-bold py-0.5 rounded text-center transition border border-slate-700 hover:border-amber-400"
                            title="Pin as Main Card Cover"
                          >
                            📌 PIN HERO
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Photo Button */}
                {formData.image_urls.length < 4 && (
                  <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition">
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-amber-400" />
                        <span className="text-slate-300 font-semibold">
                          {formData.image_urls.length === 0 ? 'Snap your gear' : '+ Add Photo'}
                        </span>
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

                {/* Rescan AI Trigger */}
                {formData.image_urls.length > 0 && (
                  <button
                    type="button"
                    onClick={() => extractMetadataFromImage(formData.image_urls[0])}
                    disabled={isExtracting}
                    className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-sans font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-2 text-xs"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Gemini Vision Scanning...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Rescan Photo #1 with AI</span>
                      </>
                    )}
                  </button>
                )}

                {extractionError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-lg text-[11px] text-left">
                    <strong>AI Error:</strong> {extractionError}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 uppercase">Brand *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Chasebaits" 
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 uppercase">Item name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. The Swinger" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 uppercase">Colourway *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Natural Green" 
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 uppercase">Gear Specs</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 9g, 90mm" 
                    value={formData.depth}
                    onChange={(e) => setFormData({ ...formData, depth: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 uppercase">Category dropdown</label>
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

              <div>
                <label className="block text-slate-400 mb-1 uppercase">Add notes</label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Recommended hook size #1/0, best in brackish estuaries..." 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:border-amber-500 outline-none resize-none"
                />
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
                    <span>Save to vault</span>
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
                <h2 className="font-bold text-lg text-slate-100">Gear to replace:</h2>
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
                  <p className="mt-1">Tap "Replace" on any item to build your shopping list!</p>
                </div>
              ) : (
                ghostItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase">{item.brand}</span>
                      <h4 className="font-semibold text-sm text-slate-200">{item.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">Colour: {item.color} | {item.depth && item.depth !== 'N/A' ? item.depth : ''}</p>
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
                onClick={handleExportRestockList}
                disabled={ghostItems.length === 0}
                className={`w-full font-sans font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                  copiedToClipboard 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50'
                }`}
              >
                {copiedToClipboard ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <span>Export list of gear to replace</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}