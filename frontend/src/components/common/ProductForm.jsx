import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Plus, X, Video, Link as LinkIcon, Play, Film, Loader2, LocateFixed } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const CATEGORIES = [
  'Flat','Apartments','Villa','Condominium','Office','Plot','Commercial','Studio','Penthouse',
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Gurgaon',
  'Noida', 'Thane', 'Navi Mumbai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kochi',
];

const EMPTY_FORM = {
  name:'', description:'', shortDescription:'', price:'', discountPrice:'',
  category:'', subcategory:'', brand:'', stock:'', unit:'sq ft',
  location:{ address:'', city:'', state:'', pincode:'', lat:'', lng:'' },
  isFeatured:false, isTrending:false, isActive:true,
  images:[], videos:[], tags:'', attributes:[],
  shippingInfo:{ freeShipping:false, shippingCost:'', deliveryDays:'' },
};

function getYoutubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]{11})/);
  return m ? m[1] : null;
}

function VideoThumb({ video, onRemove }) {
  const ytId = getYoutubeId(video.url || '');
  const isLocal = video.url?.startsWith('/uploads/') || video.url?.startsWith('blob:');

  return (
    <div className="relative group rounded-xl overflow-hidden bg-gray-900 border border-gray-200 dark:border-gray-700 flex flex-col w-44 flex-shrink-0">
      {ytId ? (
        <img
          src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
          alt={video.title}
          className="w-full h-24 object-cover"
        />
      ) : isLocal ? (
        <div className="w-full h-24 flex items-center justify-center bg-gray-800">
          <Film className="w-8 h-8 text-gray-400" />
        </div>
      ) : (
        <div className="w-full h-24 flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
          <Play className="w-8 h-8 text-white/70" />
        </div>
      )}
      <div className="p-2 flex-1 flex items-center justify-between gap-1">
        <span className="text-xs text-gray-300 truncate flex-1">{video.title || 'Property Video'}</span>
        <button
          type="button"
          onClick={onRemove}
          className="w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function ProductForm({ initial, onSubmit, loading, submitLabel = 'Save Listing', backTo = '/seller/products' }) {
  const initialForm = initial
    ? {
        ...EMPTY_FORM,
        ...initial,
        location: typeof initial.location === 'string'
          ? { city: initial.location }
          : { city: '', ...(initial.location || {}) },
      }
    : EMPTY_FORM;
  const [form, setForm]         = useState(initialForm);
  const [uploading, setUploading]   = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoTab, setVideoTab]     = useState('url');
  const [urlInput, setUrlInput]     = useState('');
  const [urlTitle, setUrlTitle]     = useState('');
  // pendingFiles maps blob URL -> File object so we can upload to server on submit
  const pendingFiles = useState(() => new Map())[0];

  const set        = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setLocation = (k, v) => setForm(f => ({ ...f, location: { ...(f.location || {}), [k]: v } }));
  const setShipping = (k, v) => setForm(f => ({ ...f, shippingInfo: { ...f.shippingInfo, [k]: v } }));

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation is not available in this browser');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm(f => ({
          ...f,
          location: {
            ...(f.location || {}),
            lat: coords.latitude.toFixed(6),
            lng: coords.longitude.toFixed(6),
          },
        }));
        toast.success('Current coordinates added');
      },
      () => toast.error('Could not get your current location'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addAttr    = () => setForm(f => ({ ...f, attributes: [...(f.attributes||[]), { key:'', value:'' }] }));
  const removeAttr = (i) => setForm(f => ({ ...f, attributes: f.attributes.filter((_,idx) => idx !== i) }));
  const setAttr    = (i,k,v) => setForm(f => ({ ...f, attributes: f.attributes.map((a,idx) => idx===i ? {...a,[k]:v} : a) }));

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const remaining = 5 - (form.images?.length || 0);
    const toAdd = files.slice(0, remaining);
    const previews = toAdd.map(file => {
      const blobUrl = URL.createObjectURL(file);
      pendingFiles.set(blobUrl, file);  // store File so we can upload before submit
      return { url: blobUrl, publicId: file.name };
    });
    setForm(f => ({ ...f, images: [...(f.images||[]), ...previews] }));
    toast.success(`${previews.length} image(s) selected — will upload on save`);
  };

  const addVideoUrl = () => {
    const url = urlInput.trim();
    if (!url) return toast.error('Please enter a video URL');
    const title = urlTitle.trim() || 'Property Tour';
    setForm(f => ({ ...f, videos: [...(f.videos||[]), { url, title }] }));
    setUrlInput('');
    setUrlTitle('');
    toast.success('Video link added');
  };

  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) return toast.error('Video must be under 200 MB');

    setVideoUploading(true);
    try {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('title', file.name.replace(/\.[^.]+$/, '') || 'Property Tour');
      const res = await api.post('/products/upload-video', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(f => ({ ...f, videos: [...(f.videos||[]), res.data.video] }));
      toast.success('Video uploaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Video upload failed');
    } finally {
      setVideoUploading(false);
      e.target.value = '';
    }
  };

  const removeVideo = (i) => setForm(f => ({ ...f, videos: (f.videos||[]).filter((_,idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category || !form.stock || !form.description || !form.location?.city)
      return toast.error('Fill all required (*) fields');

    // Upload any locally-selected (blob:) images to the server before submitting
    let finalImages = [...(form.images || [])];
    const blobImages = finalImages.filter(img => img.url?.startsWith('blob:'));
    if (blobImages.length > 0) {
      setUploading(true);
      try {
        const fd = new FormData();
        for (const img of blobImages) {
          const file = pendingFiles.get(img.url);
          if (file) fd.append('images', file);
        }
        const res = await api.post('/products/upload-images', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        // Replace blob entries with the server-returned URLs
        const uploaded = res.data.images || [];
        let uploadIdx = 0;
        finalImages = finalImages.map(img => {
          if (img.url?.startsWith('blob:') && uploadIdx < uploaded.length) {
            URL.revokeObjectURL(img.url);
            return uploaded[uploadIdx++];
          }
          return img;
        });
        // Clean up any pending file references
        blobImages.forEach(img => pendingFiles.delete(img.url));
      } catch (err) {
        setUploading(false);
        return toast.error(err.response?.data?.message || 'Image upload failed — please try again');
      }
      setUploading(false);
    }

    const lat = form.location?.lat;
    const lng = form.location?.lng;

    onSubmit({
      ...form,
      images:        finalImages,
      location:      {
        ...(typeof form.location === 'object' ? form.location : {}),
        city: form.location?.city || '',
        lat: lat === '' || lat == null ? undefined : Number(lat),
        lng: lng === '' || lng == null ? undefined : Number(lng),
      },
      price:         Number(form.price),
      discountPrice: Number(form.discountPrice) || 0,
      stock:         Number(form.stock),
      tags:          form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
      shippingInfo: {
        freeShipping: form.shippingInfo?.freeShipping || false,
        shippingCost: Number(form.shippingInfo?.shippingCost) || 0,
        deliveryDays: Number(form.shippingInfo?.deliveryDays) || 3,
      },
    });
  };

  const discount = Number(form.price) > 0 && Number(form.discountPrice) > 0
    ? Math.round(((Number(form.price) - Number(form.discountPrice)) / Number(form.price)) * 100)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

      {/* Basic Info */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Basic Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Property Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. 3 BHK Premium Flat in Bandra West" className="input text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Description <span className="text-red-500">*</span></label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={4} placeholder="Detailed property description — mention highlights, surroundings, connectivity…" className="input text-sm resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Short Description</label>
            <input value={form.shortDescription} onChange={e=>set('shortDescription',e.target.value)} placeholder="e.g. Spacious 3 BHK with sea view, ready to move" className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Category <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={e=>set('category',e.target.value)} className="input text-sm">
              <option value="">Select Category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Subcategory</label>
            <input value={form.subcategory} onChange={e=>set('subcategory',e.target.value)} placeholder="e.g. Luxury, Affordable, Ready-to-Move" className="input text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Full Address</label>
            <input value={form.location?.address || ''} onChange={e=>setLocation('address', e.target.value)} placeholder="Building, street, locality" className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">City <span className="text-red-500">*</span></label>
            <select value={form.location?.city || ''} onChange={e=>setLocation('city', e.target.value)} className="input text-sm">
              <option value="">Select city</option>
              {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">State</label>
            <input value={form.location?.state || ''} onChange={e=>setLocation('state', e.target.value)} placeholder="e.g. Maharashtra" className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Pincode</label>
            <input value={form.location?.pincode || ''} onChange={e=>setLocation('pincode', e.target.value)} placeholder="e.g. 400050" className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Map Coordinates</label>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input type="number" step="any" value={form.location?.lat || ''} onChange={e=>setLocation('lat', e.target.value)} placeholder="Lat" className="input text-sm min-w-0" />
              <input type="number" step="any" value={form.location?.lng || ''} onChange={e=>setLocation('lng', e.target.value)} placeholder="Lng" className="input text-sm min-w-0" />
              <button
                type="button"
                onClick={useCurrentLocation}
                title="Use current location"
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              >
                <LocateFixed className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Brand</label>
            <input value={form.brand} onChange={e=>set('brand',e.target.value)} placeholder="e.g. Prestige Group, Lodha, DLF" className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Unit</label>
            <input value={form.unit} onChange={e=>set('unit',e.target.value)} placeholder="sq ft, sq m, acres…" className="input text-sm" />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Pricing & Availability</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Listed Price (₹) <span className="text-red-500">*</span></label>
            <input type="number" min="0" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="5000000" className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Discounted Price (₹)</label>
            <input type="number" min="0" value={form.discountPrice} onChange={e=>set('discountPrice',e.target.value)} placeholder="4800000" className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Units Available <span className="text-red-500">*</span></label>
            <input type="number" min="0" value={form.stock} onChange={e=>set('stock',e.target.value)} placeholder="1" className="input text-sm" />
          </div>
          {discount > 0 && (
            <div className="flex flex-col justify-center p-3 bg-green-50 dark:bg-green-950/50 rounded-xl text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">You Save</p>
              <p className="text-xl font-black text-green-600 dark:text-green-400">{discount}% OFF</p>
              <p className="text-xs text-green-600 dark:text-green-400">₹{(Number(form.price)-Number(form.discountPrice)).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Images */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-gray-900 dark:text-white">Property Images <span className="text-xs font-normal text-gray-400">(max 5)</span></h2>
        <div className="flex flex-wrap gap-3">
          {(form.images||[]).map((img,i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 group">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button type="button" onClick={()=>setForm(f=>({...f,images:f.images.filter((_,idx)=>idx!==i)}))}
                  className="w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {i === 0 && <div className="absolute bottom-1 left-1 text-xs bg-indigo-600 text-white px-1.5 rounded font-semibold">Main</div>}
            </div>
          ))}
          {(form.images||[]).length < 5 && (
            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group">
              <Upload className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 mb-1 transition-colors" />
              <span className="text-xs text-gray-400 group-hover:text-indigo-500 transition-colors">Add Photo</span>
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* ── VIDEOS ─────────────────────────────────────────────────────────── */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-gray-900 dark:text-white">Property Videos</h2>
          <span className="text-xs font-normal text-gray-400 ml-1">— showcase walkthroughs & tours</span>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setVideoTab('url')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              videoTab === 'url'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Paste URL
          </button>
          <button
            type="button"
            onClick={() => setVideoTab('file')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              videoTab === 'file'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
        </div>

        {/* URL tab */}
        {videoTab === 'url' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Paste a YouTube, Google Drive, or direct MP4 link.</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addVideoUrl())}
                  placeholder="https://youtube.com/watch?v=... or https://..."
                  className="input text-sm w-full"
                />
              </div>
              <div>
                <input
                  value={urlTitle}
                  onChange={e => setUrlTitle(e.target.value)}
                  placeholder="Video title (optional)"
                  className="input text-sm w-full"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addVideoUrl}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Video
            </button>
          </div>
        )}

        {/* File upload tab */}
        {videoTab === 'file' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Upload an MP4, MOV or WebM file (max 200 MB).</p>
            <label className={`flex flex-col items-center justify-center w-full py-10 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              videoUploading
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 cursor-not-allowed'
                : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'
            }`}>
              {videoUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Uploading video…</p>
                  <p className="text-xs text-gray-400 mt-1">Please wait, this may take a moment</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-3">
                    <Film className="w-6 h-6 text-indigo-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload a video file</p>
                  <p className="text-xs text-gray-400 mt-1">MP4, MOV, WebM — up to 200 MB</p>
                </>
              )}
              <input
                type="file"
                accept="video/*"
                disabled={videoUploading}
                onChange={handleVideoFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Video previews */}
        {(form.videos||[]).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Added Videos ({form.videos.length})
            </p>
            <div className="flex gap-3 flex-wrap">
              {(form.videos||[]).map((v, i) => (
                <VideoThumb key={i} video={v} onRemove={() => removeVideo(i)} />
              ))}
            </div>
          </div>
        )}

        {(form.videos||[]).length === 0 && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              <Video className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">No videos added yet. Add a YouTube link or upload a video file above.</p>
          </div>
        )}
      </div>
      {/* ──────────────────────────────────────────────────────────────────── */}

      {/* Specifications */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white">Property Details / Specifications</h2>
          <button type="button" onClick={addAttr} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
        </div>
        {(form.attributes||[]).length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">No details yet. Click "Add Row" to add specs like BHK Type, Furnishing, Carpet Area, Age of Property, etc.</p>}
        {(form.attributes||[]).map((attr,i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={attr.key}   onChange={e=>setAttr(i,'key',e.target.value)}   placeholder="Key (e.g. BHK Type)"   className="input text-sm flex-1" />
            <input value={attr.value} onChange={e=>setAttr(i,'value',e.target.value)} placeholder="Value (e.g. 3 BHK)"     className="input text-sm flex-1" />
            <button type="button" onClick={()=>removeAttr(i)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Tags + Shipping */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-gray-900 dark:text-white">Tags</h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Comma-separated tags</label>
            <input value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="mumbai, sea-view, 3bhk, luxury, ready-to-move" className="input text-sm" />
          </div>
        </div>
        <div className="card p-5 space-y-3">
          <h2 className="font-bold text-gray-900 dark:text-white">Possession</h2>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input type="checkbox" checked={!!form.shippingInfo?.freeShipping} onChange={e=>setShipping('freeShipping',e.target.checked)} className="accent-indigo-600" />
            Ready to Move In
          </label>
          {!form.shippingInfo?.freeShipping && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Maintenance Cost (₹/month)</label>
              <input type="number" value={form.shippingInfo?.shippingCost||''} onChange={e=>setShipping('shippingCost',e.target.value)} placeholder="5000" className="input text-sm" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Possession in (months)</label>
            <input type="number" value={form.shippingInfo?.deliveryDays||''} onChange={e=>setShipping('deliveryDays',e.target.value)} placeholder="6" className="input text-sm" />
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3">Visibility Options</h2>
        <div className="flex flex-wrap gap-6">
          {[
            ['isActive',   'Active (listed on platform)'],
            ['isFeatured', 'Featured (shown on homepage)'],
            ['isTrending', 'Mark as Trending 🔥'],
          ].map(([k,label]) => (
            <label key={k} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              <input type="checkbox" checked={!!form[k]} onChange={e=>set(k,e.target.checked)} className="accent-indigo-600" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading || uploading} className="btn-primary flex items-center gap-2 px-8">
          {(loading || uploading) && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {uploading && <span>Uploading images…</span>}
          {submitLabel}
        </button>
        <Link to={backTo} className="btn-secondary px-6">Cancel</Link>
      </div>
    </form>
  );
}
