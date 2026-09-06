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
  Check,
  Image as ImageIcon
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
  created_at?: string;
}

// Sub-component for Multi-Slide Carousel per Card
function CardCarousel({ 
  item, 
  onEditNotes,
  onEditSpecs,
  onEditPhotos,
  onToggleFavorite,
  onDeleteItem
}: { 
  item: GearItem;
  onEditNotes: (item: GearItem) => void;
  onEditSpecs: (item: GearItem) => void;
  onEditPhotos: (item: GearItem) => void;
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

  const formattedDate = item.created_at 
    ? new Date(item.created_at).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

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
        /* SPECS SLIDE */
        <div className="w-full h-full p-3 pb-8 bg-slate-900/95 flex flex-col justify-between font-mono text-xs overflow-y-auto">
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
              <p><span className="text-slate-500">Date added:</span> <span className="text-slate-100">{formattedDate}</span></p>
            </div>
          </div>
        </div>
      ) : isNotesSlide ? (
        /* NOTES SLIDE (Edit images on left, Edit Notes on right) */
        <div className="w-full h-full p-3 pb-8 bg-slate-900/95 flex flex-col justify-between font-mono text-xs overflow-y-auto relative">
          <div>
            {/* Header Row */}
            <div className="h-6 flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-100 uppercase font-bold tracking-wider leading-none">
                Notes
              </span>
              
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

            <div className="pt-1">
              <div className="text-slate-100 text-[11px] leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 min-h-[90px] max-h-[130px] overflow-y-auto w-full">
                {item.notes ? item.notes : <span className="text-slate-500">No custom notes logged yet. Tap Edit Notes below to add notes!</span>}
              </div>

              {/* Edit images on Left, Edit Notes on Right */}
              <div className="flex items-center justify-between mt-2.5">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPhotos(item);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-2 py-1 rounded text-[10px] flex items-center gap-1 transition z-20"
                >
                  <Camera className="w-3 h-3 text-slate-100" />
                  <span>Edit images</span>
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditNotes(item);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-2 py-1 rounded text-[10px] flex items-center gap-1 transition z-20"
                >
                  <Edit3 className="w-3 h-3 text-slate-100" />
                  <span>Edit Notes</span>
                </button>
              </div>
            </div>
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

      {/* Navigation Dots Indicator Bar - Active Dot Changed to White */}
      <div className="absolute bottom-1.5 inset-x-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <span 
              key={idx} 
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === idx ? 'w-3 bg-white' : 'w-1.5 bg-slate-600'
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
    type: 'Hardbody',
    species: ''
  });
  const [isSavingSpecs, setIsSavingSpecs] = useState(false);

  // Edit Photos Modal State
  const [itemToEditPhotos, setItemToEditPhotos] = useState<GearItem | null>(null);
  const [modalPhotos, setModalPhotos] = useState<string[]>([]);
  const [isSavingPhotos, setIsSavingPhotos] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: 'Hardbody',
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
        type: item.type === 'Hardbody Suspending' ? 'Hardbody' : item.type,
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

  const openSpecsEditor = (item: GearItem) => {
    setItemToEditSpecs(item);
    setEditedSpecs({
      brand: item.brand,
      name: item.name,
      color: item.color,
      depth: item.depth || '',
      type: item.type === 'Hardbody Suspending' ? 'Hardbody' : item.type,
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

  const openPhotosEditor = (item: GearItem) => {
    setItemToEditPhotos(item);
    setModalPhotos(item.image_urls && item.image_urls.length > 0 ? [...item.image_urls] : [item.image_url]);
  };

  const handleModalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      alert('Image upload failed.');
      setIsUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('tackle-vault-images')
      .getPublicUrl(filePath);

    setModalPhotos(prev => [...prev, publicUrlData.publicUrl]);
    setIsUploading(false);
  };

  const removeModalPhoto = (indexToRemove: number) => {
    if (modalPhotos.length <= 1) {
      alert('Items must keep at least 1 photo.');
      return;
    }
    setModalPhotos(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const pinModalHero = (indexToPin: number) => {
    setModalPhotos(prev => {
      const selected = prev[indexToPin];
      const remaining = prev.filter((_, idx) => idx !== indexToPin);
      return [selected, ...remaining];
    });
  };

  const saveUpdatedPhotos = async () => {
    if (!itemToEditPhotos || modalPhotos.length === 0) return;
    setIsSavingPhotos(true);

    const fallbackCover = modalPhotos[0];

    const { error } = await supabase
      .from('gear_items')
      .update({
        image_url: fallbackCover,
        image_urls: modalPhotos
      })
      .eq('id', itemToEditPhotos.id);

    if (error) {
      console.error('Failed to update photos:', error);
      alert('Could not update item photos.');
    } else {
      setItems(items.map(item => 
        item.id === itemToEditPhotos.id 
          ? { ...item, image_url: fallbackCover, image_urls: modalPhotos } 
          : item
      ));
      setItemToEditPhotos(null);
    }
    setIsSavingPhotos(false);
  };

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
    setViewMode('grid');
    if (activeCategoryFilter === categoryType) {
      setActiveCategoryFilter(null);
    } else {
      setActiveCategoryFilter(categoryType);
      scrollToSection('my-gear-section');
    }
  };

  const handleBrandClick = (brandName: string) => {
    setViewMode('grid');
    if (activeBrandFilter === brandName) {
      setActiveBrandFilter(null);
    } else {
      setActiveBrandFilter(brandName);
      scrollToSection('my-gear-section');
    }
  };

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
          type: result.data.type === 'Hardbody Suspending' ? 'Hardbody' : (result.data.type || prev.type),
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
        type: data[0].type === 'Hardbody Suspending' ? 'Hardbody' : data[0].type,
        image_urls: data[0].image_urls && data[0].image_urls.length > 0 ? data[0].image_urls : [data[0].image_url]
      } as GearItem;

      setItems([insertedItem, ...items]);
      setFormData({
        name: '',
        brand: '',
        type: 'Hardbody',
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
      
      {/* Header Bar - Clicking Logo/Title Returns to Grid View */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => {
              setView