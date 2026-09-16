import React, { useState, useEffect } from 'react';
import { 
  Truck, Search, Check, X, ShieldCheck, MapPin, 
  Clock, User, TrendingUp, AlertCircle, RefreshCw, Filter, ShieldAlert,
  Globe, Key, Webhook, Plus, ExternalLink, Code2, Send, Sliders, Copy,
  CheckCircle, Activity, Layers, ArrowUpRight
} from 'lucide-react';
import { LogisticsProvider, Order } from '../types';
import * as api from '../api';

interface Rider {
  id: string;
  name: string;
  phone: string;
  city: string;
  vehicleType: 'motorcycle' | 'bicycle' | 'van' | 'car';
  status: 'Approved' | 'Pending' | 'Rejected';
  rating: number;
  completedJobs: number;
}

interface DeliveryJob {
  id: string;
  trackingNumber: string;
  providerId: string;
  providerName: string;
  origin: string;
  destination: string;
  vendorName: string;
  buyerName: string;
  amount: number;
  riderName?: string;
  status: 'Searching' | 'Assigned' | 'Picked Up' | 'In Transit' | 'Delivered' | 'Returned';
  priority: 'express' | 'standard';
  lastUpdated: string;
  apiSynced?: boolean;
}

interface WebhookLog {
  id: string;
  timestamp: string;
  providerName: string;
  event: string;
  trackingNumber: string;
  status: '200 OK' | '201 Created' | '400 Error';
  payloadSummary: string;
}

interface AdminDeliveriViewProps {
  orders?: Order[];
  onUpdateOrderStatus?: (orderId: string, status: Order['status']) => void;
}

export default function AdminDeliveriView({ orders, onUpdateOrderStatus }: AdminDeliveriViewProps) {
  // Main Tab State
  const [activeSubTab, setActiveSubTab] = useState<'carriers' | 'shipments' | 'webhooks' | 'riders' | 'zones'>('carriers');

  // Logistics Providers Datastore State — loaded from the backend (GET is public;
  // create/update/delete require the admin token, already attached in src/api.ts).
  const [providers, setProviders] = useState<LogisticsProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getLogisticsProviders();
        if (!cancelled) setProviders(data);
      } catch (e: any) {
        if (!cancelled) setProvidersError(e.message || 'Could not load logistics providers.');
      } finally {
        if (!cancelled) setProvidersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Flat-fee delivery zones (Suremart-style local zones, distinct from the
  // API-driven carriers above) — also backend-backed.
  const [zones, setZones] = useState<any[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zonesError, setZonesError] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneFee, setNewZoneFee] = useState('');
  const [newZoneIsFree, setNewZoneIsFree] = useState(false);

  const refreshZones = async () => {
    try {
      const data = await api.getAllDeliveryZones();
      setZones(data);
      setZonesError(null);
    } catch (e: any) {
      setZonesError(e.message || 'Could not load delivery zones.');
    } finally {
      setZonesLoading(false);
    }
  };

  useEffect(() => {
    refreshZones();
  }, []);

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) {
      showToast('Please enter a zone name.');
      return;
    }
    try {
      await api.createDeliveryZone({
        zoneName: newZoneName.trim(),
        fee: newZoneIsFree ? 0 : Number(newZoneFee) || 0,
        isFree: newZoneIsFree,
      });
      setNewZoneName('');
      setNewZoneFee('');
      setNewZoneIsFree(false);
      await refreshZones();
      showToast(`Zone "${newZoneName}" added.`);
    } catch (e: any) {
      showToast(e.message || 'Could not add zone.');
    }
  };

  const handleToggleZoneActive = async (zone: any) => {
    try {
      await api.updateDeliveryZone(zone.id, { isActive: !zone.isActive });
      await refreshZones();
    } catch (e: any) {
      showToast(e.message || 'Could not update zone.');
    }
  };

  const handleDeleteZone = async (zone: any) => {
    try {
      await api.deleteDeliveryZone(zone.id);
      await refreshZones();
      showToast(`Zone "${zone.zoneName}" removed.`);
    } catch (e: any) {
      showToast(e.message || 'Could not remove zone.');
    }
  };
  
  // Selected Provider Filter
  const [providerFilter, setProviderFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add New Carrier Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCarrierName, setNewCarrierName] = useState<string>('');
  const [newCarrierType, setNewCarrierType] = useState<'API' | 'Webhook' | 'API_and_Webhook'>('API_and_Webhook');
  const [newCarrierEndpoint, setNewCarrierEndpoint] = useState<string>('https://api.expresslogistics.com/v1');
  const [newCarrierApiKey, setNewCarrierApiKey] = useState<string>('exp_live_key_' + Math.random().toString(36).substring(2, 10));
  const [newCarrierWebhookUrl, setNewCarrierWebhookUrl] = useState<string>('https://tradeease.ng/api/webhooks/custom');
  const [newCarrierWebhookSecret, setNewCarrierWebhookSecret] = useState<string>('whsec_' + Math.random().toString(36).substring(2, 12));
  const [newCarrierBaseFee, setNewCarrierBaseFee] = useState<number>(2500);
  const [newCarrierPerKm, setNewCarrierPerKm] = useState<number>(180);
  const [newCarrierEstDays, setNewCarrierEstDays] = useState<string>('1 - 2 Days');
  const [newCarrierBadge, setNewCarrierBadge] = useState<string>('EXPRESS COURIER');
  const [newCarrierDesc, setNewCarrierDesc] = useState<string>('Integrated parcel logistics API with automated tracking events.');
  const [newCarrierServices, setNewCarrierServices] = useState<string>('Next-Day Air, Doorstep Delivery, Webhook Callbacks');

  // Configure Selected Provider API Modal
  const [selectedConfigProvider, setSelectedConfigProvider] = useState<LogisticsProvider | null>(null);

  // Webhook Test Payload Simulator State
  const [simProviderCode, setSimProviderCode] = useState<string>('dhl');
  const [simEvent, setSimEvent] = useState<string>('shipment.status_updated');
  const [simTrackingNumber, setSimTrackingNumber] = useState<string>('DHL-99201923');
  const [simStatus, setSimStatus] = useState<string>('In Transit');
  const [simLocation, setSimLocation] = useState<string>('Lagos Cargo Airport Terminal');
  const [simNotes, setSimNotes] = useState<string>('Package processed through automated sorting hub');
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([
    {
      id: 'wh-001',
      timestamp: 'Just now',
      providerName: 'UPS Express',
      event: 'shipment.created',
      trackingNumber: 'UPS-88291039',
      status: '201 Created',
      payloadSummary: 'Dispatch order registered via REST API endpoint'
    },
    {
      id: 'wh-002',
      timestamp: '10 mins ago',
      providerName: 'DHL Express',
      event: 'shipment.status_updated',
      trackingNumber: 'DHL-99201923',
      status: '200 OK',
      payloadSummary: 'Status updated to In Transit [Customs Cleared]'
    },
    {
      id: 'wh-003',
      timestamp: '25 mins ago',
      providerName: 'DELIVERI Logistics',
      event: 'rider.assigned',
      trackingNumber: 'TE-DEL-04812',
      status: '200 OK',
      payloadSummary: 'Rider Kelechi Nnamdi accepted dispatch job'
    }
  ]);

  // Toast Notification Message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Riders Datastore State
  const [riders, setRiders] = useState<Rider[]>([
    { id: 'DRV-102', name: 'Kelechi Nnamdi', phone: '+234 803 123 4567', city: 'Lagos', vehicleType: 'motorcycle', status: 'Approved', rating: 4.8, completedJobs: 142 },
    { id: 'DRV-105', name: 'Yakubu Haruna', phone: '+234 812 987 6543', city: 'Kano', vehicleType: 'motorcycle', status: 'Pending', rating: 0.0, completedJobs: 0 },
    { id: 'DRV-108', name: 'Adebayo Adesina', phone: '+234 705 444 3322', city: 'Lagos', vehicleType: 'motorcycle', status: 'Approved', rating: 4.9, completedJobs: 310 },
    { id: 'DRV-110', name: 'Ngozi Nwosu', phone: '+234 908 665 1111', city: 'Abuja', vehicleType: 'van', status: 'Approved', rating: 4.7, completedJobs: 88 },
    { id: 'DRV-112', name: 'Musa Abdullahi', phone: '+234 816 777 8899', city: 'Abuja', vehicleType: 'motorcycle', status: 'Pending', rating: 0.0, completedJobs: 0 },
    { id: 'DRV-115', name: 'Eromosele Jerry', phone: '+234 805 222 9900', city: 'Port Harcourt', vehicleType: 'car', status: 'Rejected', rating: 3.1, completedJobs: 5 }
  ]);

  // Universal Deliveries Queue
  const [deliveries, setDeliveries] = useState<DeliveryJob[]>([
    { id: 'JOB-901', trackingNumber: 'TE-DEL-04812', providerId: 'provider-deliveri', providerName: 'DELIVERI Logistics', origin: 'Lagos Gadget Hub, Ikeja', destination: 'Victoria Island, Lagos', vendorName: 'Lagos Gadget Hub', buyerName: 'Oluwaseun Adepoju', amount: 4500, riderName: 'Kelechi Nnamdi', status: 'In Transit', priority: 'express', lastUpdated: '12 mins ago', apiSynced: true },
    { id: 'JOB-902', trackingNumber: 'UPS-88291039', providerId: 'provider-ups', providerName: 'UPS Express', origin: 'Computer Village, Ikeja', destination: 'Maitama, Abuja', vendorName: 'Lekki Tech Vault', buyerName: 'Amina Bello', amount: 6500, status: 'In Transit', priority: 'express', lastUpdated: '5 mins ago', apiSynced: true },
    { id: 'JOB-903', trackingNumber: 'DHL-99201923', providerId: 'provider-dhl', providerName: 'DHL Express', origin: 'Amina Foods, Wuse II', destination: 'GRA Phase 2, Port Harcourt', vendorName: 'Naija Whole Foods', buyerName: 'Chioma Nze', amount: 5800, status: 'Assigned', priority: 'standard', lastUpdated: '2 mins ago', apiSynced: true },
    { id: 'JOB-904', trackingNumber: 'FDX-77102938', providerId: 'provider-fedex', providerName: 'FedEx Priority', origin: 'Alara Tailoring House, Surulere', destination: 'Lekki Phase 1, Lagos', vendorName: 'Alara Tailoring House', buyerName: 'Ibrahim Musa', amount: 4200, status: 'Searching', priority: 'express', lastUpdated: '1 min ago', apiSynced: false },
    { id: 'JOB-905', trackingNumber: 'GIG-55102948', providerId: 'provider-gig', providerName: 'GIG Logistics', origin: 'Enugu Spice Bazaar', destination: 'Abakpa, Enugu', vendorName: 'Enugu Spice Bazaar', buyerName: 'Emeka Okafor', amount: 2800, status: 'Delivered', priority: 'standard', lastUpdated: '1 hour ago', apiSynced: true }
  ]);

  // Rate Adjuster State
  const [surgeActive, setSurgeActive] = useState(false);

  // Handler to toggle provider status
  const handleToggleProviderStatus = async (id: string) => {
    const target = providers.find(p => p.id === id);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await api.updateLogisticsProvider(id, { status: nextStatus });
      setProviders(prev => prev.map(p => (p.id === id ? updated : p)));
      showToast(`${updated.name} status updated to ${nextStatus.toUpperCase()}`);
    } catch (e: any) {
      showToast(e.message || 'Could not update provider status.');
    }
  };

  // Handler to add a new custom logistics provider via API/Webhook
  const handleAddCarrierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCarrierName.trim()) {
      showToast('Please enter a valid carrier name.');
      return;
    }

    const code = newCarrierName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newProviderInput: Partial<LogisticsProvider> = {
      name: newCarrierName.trim(),
      code: code,
      type: newCarrierType,
      status: 'active',
      apiEndpoint: newCarrierEndpoint,
      apiKey: newCarrierApiKey,
      webhookUrl: newCarrierWebhookUrl,
      webhookSecret: newCarrierWebhookSecret,
      baseFee: Number(newCarrierBaseFee) || 2000,
      perKmRate: Number(newCarrierPerKm) || 150,
      estimatedDays: newCarrierEstDays || '1 - 2 Days',
      badge: newCarrierBadge.toUpperCase() || 'EXPRESS API',
      description: newCarrierDesc || 'Integrated logistics service provider.',
      rating: 5.0,
      supportedServices: newCarrierServices.split(',').map(s => s.trim()).filter(Boolean),
      trackingUrlTemplate: `${newCarrierEndpoint}/track/{trackingNumber}`
    };

    try {
      const created = await api.createLogisticsProvider(newProviderInput);
      setProviders(prev => [created, ...prev]);
      setShowAddModal(false);
      showToast(`New Carrier "${newCarrierName}" added successfully via ${newCarrierType}!`);
      setNewCarrierName('');
    } catch (e: any) {
      showToast(e.message || 'Could not add carrier.');
    }
  };

  // Handler to trigger simulated Webhook POST
  const handleTriggerWebhookSim = (e: React.FormEvent) => {
    e.preventDefault();
    const provider = providers.find(p => p.code === simProviderCode) || providers[0];
    
    // Update matching delivery job if tracking number matches
    setDeliveries(prev => prev.map(d => {
      if (d.trackingNumber.toLowerCase() === simTrackingNumber.toLowerCase()) {
        const mappedStatus = simStatus === 'Delivered' ? 'Delivered' : simStatus === 'In Transit' ? 'In Transit' : d.status;
        showToast(`Webhook event received! Updated order ${d.trackingNumber} to ${simStatus}`);
        return { ...d, status: mappedStatus as any, lastUpdated: 'Just now (Webhook Event)', apiSynced: true };
      }
      return d;
    }));

    const newLog: WebhookLog = {
      id: 'wh-' + Date.now(),
      timestamp: 'Just now',
      providerName: provider.name,
      event: simEvent,
      trackingNumber: simTrackingNumber,
      status: '200 OK',
      payloadSummary: `Status: ${simStatus} | Hub: ${simLocation} | Note: ${simNotes}`
    };

    setWebhookLogs(prev => [newLog, ...prev]);
    showToast(`Webhook event dispatched for ${provider.name} [200 OK]`);
  };

  // Filtered providers
  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'All' || p.type === typeFilter;
    const matchesStatus = providerFilter === 'All' || p.status === providerFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const activeCarriersCount = providers.filter(p => p.status === 'active').length;
  const totalShipmentsCount = deliveries.length;

  return (
    <div className="space-y-6">
      {/* Toast Overlay */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white border border-emerald-500/40 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-bounce-short">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Page Title & Logistics Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <span>TradeEase Logistics & Webhook Hub</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Multi-Carrier
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Connect and manage DELIVERI alongside UPS, DHL, FedEx, GIG Logistics, Red Star, and custom API / Webhook partners.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-650 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Carrier via API/Webhook</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black tracking-wider text-gray-400 uppercase">Connected Logistics Carriers</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {activeCarriersCount} / {providers.length}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-3 flex items-center gap-1">
            <span>● DELIVERI, UPS, DHL, FedEx, GIG & Red Star active</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black tracking-wider text-gray-400 uppercase">API & Webhook Integrations</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {providers.filter(p => p.type !== 'API').length} Webhooks / {providers.filter(p => p.type !== 'Webhook').length} APIs
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400">
              <Code2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-3 font-medium">
            Real-time payload status sync & auto-dispatch
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black tracking-wider text-gray-400 uppercase">Active Shipments</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {totalShipmentsCount}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-3">
            Routed across multi-carrier networks
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black tracking-wider text-gray-400 uppercase">Webhook Event Logs</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {webhookLogs.length} Events
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
              <Webhook className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-3">
            100% Delivery Webhook success rate
          </p>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('carriers')}
          className={`pb-3 px-4 text-xs font-black transition-all cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'carriers'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>All Logistics Carriers ({providers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('shipments')}
          className={`pb-3 px-4 text-xs font-black transition-all cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'shipments'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Universal Shipments Queue ({deliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('webhooks')}
          className={`pb-3 px-4 text-xs font-black transition-all cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'webhooks'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Webhook className="w-4 h-4" />
          <span>API & Webhook Tester ({webhookLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('riders')}
          className={`pb-3 px-4 text-xs font-black transition-all cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'riders'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Local Couriers & Riders ({riders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('zones')}
          className={`pb-3 px-4 text-xs font-black transition-all cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
            activeSubTab === 'zones'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Delivery Zones ({zones.length})</span>
        </button>
      </div>

      {/* TAB 1: ALL LOGISTICS CARRIERS */}
      {activeSubTab === 'carriers' && (
        <div className="space-y-6">
          {providersLoading && (
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-4 text-xs text-gray-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading carriers from the server...
            </div>
          )}
          {providersError && !providersLoading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-500 font-bold">
              {providersError}
            </div>
          )}
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search carriers, codes or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs py-2 px-3 text-gray-800 dark:text-white focus:outline-none"
              >
                <option value="All">All Integration Types</option>
                <option value="API">API Only</option>
                <option value="Webhook">Webhook Only</option>
                <option value="API_and_Webhook">Hybrid (API & Webhook)</option>
              </select>

              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs py-2 px-3 text-gray-800 dark:text-white focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Carrier Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProviders.map((carrier) => (
              <div
                key={carrier.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between space-y-4 relative ${
                  carrier.status === 'active'
                    ? 'border-gray-200 dark:border-slate-800 hover:border-emerald-500/50 shadow-xs'
                    : 'border-gray-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-center font-black text-xs uppercase font-mono border border-gray-200 dark:border-slate-700">
                        {carrier.code.substring(0, 3)}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                          <span>{carrier.name}</span>
                          {carrier.badge && (
                            <span className="text-[8.5px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded font-mono">
                              {carrier.badge}
                            </span>
                          )}
                        </h3>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">Code: {carrier.code}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleProviderStatus(carrier.id)}
                      className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider cursor-pointer transition-all ${
                        carrier.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                          : 'bg-gray-200 text-gray-600 dark:bg-slate-800 dark:text-gray-400'
                      }`}
                    >
                      {carrier.status}
                    </button>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">
                    {carrier.description}
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Integration Mode:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200 font-mono text-[10.5px] bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded">
                        {carrier.type === 'API_and_Webhook' ? 'API + Webhook (Hybrid)' : carrier.type}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Base Delivery Rate:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        ₦{carrier.baseFee.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-medium">Estimated Transit:</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {carrier.estimatedDays}
                      </span>
                    </div>
                  </div>

                  {/* Supported Services Chips */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {carrier.supportedServices.map((srv, idx) => (
                      <span key={idx} className="text-[9px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-medium px-2 py-0.5 rounded-md">
                        ✓ {srv}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedConfigProvider(carrier)}
                    className="flex-1 py-1.5 px-3 text-[10.5px] font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>API Keys & Endpoint</span>
                  </button>

                  <button
                    onClick={() => {
                      setSimProviderCode(carrier.code);
                      setSimTrackingNumber(`${carrier.code.toUpperCase()}-${Math.floor(Math.random() * 90000) + 10000}`);
                      setActiveSubTab('webhooks');
                    }}
                    className="py-1.5 px-3 text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Webhook className="w-3.5 h-3.5" />
                    <span>Test Webhook</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: UNIVERSAL SHIPMENTS QUEUE */}
      {activeSubTab === 'shipments' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-150 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">Multi-Carrier Shipments Queue</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Live tracking for orders processed via DELIVERI, UPS, DHL, FedEx, GIG, or Red Star.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newJob: DeliveryJob = {
                    id: `JOB-${Math.floor(Math.random() * 900) + 100}`,
                    trackingNumber: `UPS-${Math.floor(Math.random() * 90000) + 10000}`,
                    providerId: 'provider-ups',
                    providerName: 'UPS Express',
                    origin: 'Lagos Island Market',
                    destination: 'Abuja Central Terminal',
                    vendorName: 'Lekki Tech Vault',
                    buyerName: 'Merchant Partner',
                    amount: 5200,
                    status: 'Searching',
                    priority: 'express',
                    lastUpdated: 'Just now',
                    apiSynced: true
                  };
                  setDeliveries(prev => [newJob, ...prev]);
                  showToast('New multi-carrier shipment added to dispatch queue!');
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-xl hover:bg-emerald-100 cursor-pointer transition-all"
              >
                + Simulate New Shipment
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-150 dark:divide-slate-800">
            {deliveries.map((job) => (
              <div key={job.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200">
                      {job.trackingNumber}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                      Carrier: {job.providerName}
                    </span>
                    {job.apiSynced && (
                      <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded">
                        API SYNCED
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">• {job.lastUpdated}</span>
                  </div>

                  <span className={`text-[10px] font-black rounded-full px-3 py-0.5 ${
                    job.status === 'Searching'
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                      : job.status === 'Assigned'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                        : job.status === 'In Transit'
                          ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                  }`}>
                    {job.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Vendor Pickup:</span>
                    <p className="font-bold text-gray-900 dark:text-white">{job.origin} ({job.vendorName})</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Buyer Delivery Destination:</span>
                    <p className="font-bold text-gray-900 dark:text-white">{job.destination} ({job.buyerName})</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Fulfillment Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₦{job.amount.toLocaleString()}</strong>
                  </span>

                  <button
                    onClick={() => {
                      setSimProviderCode(job.providerName.toLowerCase().includes('ups') ? 'ups' : job.providerName.toLowerCase().includes('dhl') ? 'dhl' : 'deliveri');
                      setSimTrackingNumber(job.trackingNumber);
                      setSimStatus('Delivered');
                      setActiveSubTab('webhooks');
                    }}
                    className="text-[10.5px] font-bold text-emerald-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Simulate Webhook Delivery Callback</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: API & WEBHOOK EVENT TESTER */}
      {activeSubTab === 'webhooks' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulator Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-500" />
                <span>Logistics Webhook & API Payload Dispatcher</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Simulate incoming HTTP POST webhook callbacks from UPS, DHL, FedEx, DELIVERI or custom carriers.
              </p>
            </div>

            <form onSubmit={handleTriggerWebhookSim} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-500 uppercase text-[10px]">Target Carrier Provider</label>
                <select
                  value={simProviderCode}
                  onChange={(e) => setSimProviderCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-bold text-gray-900 dark:text-white focus:outline-none"
                >
                  {providers.map(p => (
                    <option key={p.id} value={p.code}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase text-[10px]">Webhook Event</label>
                  <select
                    value={simEvent}
                    onChange={(e) => setSimEvent(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-bold text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="shipment.created">shipment.created</option>
                    <option value="shipment.status_updated">shipment.status_updated</option>
                    <option value="shipment.delivered">shipment.delivered</option>
                    <option value="customs.cleared">customs.cleared</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase text-[10px]">Tracking Number</label>
                  <input
                    type="text"
                    value={simTrackingNumber}
                    onChange={(e) => setSimTrackingNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-mono text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase text-[10px]">Carrier New Status</label>
                  <select
                    value={simStatus}
                    onChange={(e) => setSimStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-bold text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="Picked Up">Picked Up</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase text-[10px]">Location Hub</label>
                  <input
                    type="text"
                    value={simLocation}
                    onChange={(e) => setSimLocation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-500 uppercase text-[10px]">Payload Event Note</label>
                <input
                  type="text"
                  value={simNotes}
                  onChange={(e) => setSimNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-650 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Webhook Payload (HTTP POST)</span>
              </button>
            </form>
          </div>

          {/* Webhook Audit Stream Log */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <div className="border-b border-gray-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white">Webhook Audit Log Stream</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Real-time incoming webhook request records and HTTP status codes.</p>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 font-mono font-bold px-2 py-0.5 rounded">
                LIVE LISTENER
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto">
              {webhookLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-150 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Webhook className="w-3 h-3 text-emerald-500" />
                      <span>{log.providerName}</span>
                      <span className="text-[9px] font-mono text-gray-400">[{log.event}]</span>
                    </span>

                    <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.2 rounded">
                      {log.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                    <span>Tracking: {log.trackingNumber}</span>
                    <span>{log.timestamp}</span>
                  </div>

                  <p className="text-[10.5px] text-gray-600 dark:text-gray-300 font-mono bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-slate-800">
                    {log.payloadSummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LOCAL RIDERS & COURIERS */}
      {activeSubTab === 'riders' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-slate-800 shadow-xs p-6 space-y-4">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black text-gray-900 dark:text-white">DELIVERI & Local Courier Dispatcher Roster</h3>
            <p className="text-[11px] text-gray-400">Onboarded dispatch drivers, motorcycle riders and regional terminal agents.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-gray-400 font-bold border-b border-gray-150 dark:border-slate-800">
                  <th className="p-3">Rider ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Hub Zone</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-slate-800">
                {riders.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-mono font-bold text-gray-500">{r.id}</td>
                    <td className="p-3 font-extrabold text-gray-900 dark:text-white">{r.name}</td>
                    <td className="p-3">{r.phone}</td>
                    <td className="p-3 font-bold">{r.city}</td>
                    <td className="p-3 capitalize">{r.vehicleType}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                        r.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-amber-500">★ {r.rating || 4.8}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DELIVERY ZONES */}
      {activeSubTab === 'zones' && (
        <div className="space-y-6">
          {zonesLoading && (
            <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-4 text-xs text-gray-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading delivery zones...
            </div>
          )}
          {zonesError && !zonesLoading && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-500 font-bold">{zonesError}</div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-950 dark:text-white uppercase tracking-wider">Flat-Fee Local Delivery Zones</h3>
              <p className="text-[11px] text-gray-400">Simple named zones with a fixed delivery fee — carried over from Suremart's original local delivery setup.</p>
            </div>

            <form onSubmit={handleAddZone} className="flex flex-wrap items-end gap-2.5 text-xs p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800">
              <div className="flex-1 min-w-[160px] space-y-1">
                <label className="font-bold text-gray-500 uppercase text-[10px]">Zone Name</label>
                <input
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="e.g. GRA Phase 3"
                  className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-gray-900 dark:text-white"
                />
              </div>
              <div className="w-28 space-y-1">
                <label className="font-bold text-gray-500 uppercase text-[10px]">Fee (₦)</label>
                <input
                  type="number"
                  value={newZoneFee}
                  onChange={(e) => setNewZoneFee(e.target.value)}
                  disabled={newZoneIsFree}
                  placeholder="1500"
                  className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 pb-2.5 cursor-pointer">
                <input type="checkbox" checked={newZoneIsFree} onChange={(e) => setNewZoneIsFree(e.target.checked)} />
                Free
              </label>
              <button
                type="submit"
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[10px] cursor-pointer"
              >
                Add Zone
              </button>
            </form>

            <div className="divide-y divide-gray-100 dark:divide-slate-850">
              {zones.length === 0 && !zonesLoading && (
                <p className="text-[11px] text-gray-400 py-3">No delivery zones yet — add one above.</p>
              )}
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{zone.zoneName}</p>
                      <p className="text-[10px] text-gray-400">
                        {zone.isFree ? 'Free delivery' : `₦${zone.fee.toLocaleString()}`}
                        {' · '}
                        <span className={zone.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}>
                          {zone.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleZoneActive(zone)}
                      className="py-1 px-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-[10px] uppercase cursor-pointer"
                    >
                      {zone.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteZone(zone)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                      title="Delete zone"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW CARRIER VIA API OR WEBHOOK */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Add Logistics Provider (API / Webhook)
                </h3>
              </div>

              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCarrierSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase text-[10px]">Company / Carrier Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CourierPlus, Speedaf, Kwik"
                    value={newCarrierName}
                    onChange={(e) => setNewCarrierName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-bold text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase text-[10px]">Integration Type</label>
                  <select
                    value={newCarrierType}
                    onChange={(e) => setNewCarrierType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-bold text-gray-900 dark:text-white focus:outline-none"
                  >
                    <option value="API_and_Webhook">API + Webhook (Hybrid)</option>
                    <option value="API">REST API Endpoint Only</option>
                    <option value="Webhook">Webhook Listener Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-500 uppercase text-[10px]">Carrier API Base Endpoint URL</label>
                <input
                  type="text"
                  value={newCarrierEndpoint}
                  onChange={(e) => setNewCarrierEndpoint(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-mono text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase text-[10px]">API Key / Secret Token</label>
                  <input
                    type="text"
                    value={newCarrierApiKey}
                    onChange={(e) => setNewCarrierApiKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-mono text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase text-[10px]">Webhook Listener URL</label>
                  <input
                    type="text"
                    value={newCarrierWebhookUrl}
                    onChange={(e) => setNewCarrierWebhookUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-mono text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase text-[10px]">Base Fee (₦)</label>
                  <input
                    type="number"
                    value={newCarrierBaseFee}
                    onChange={(e) => setNewCarrierBaseFee(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-mono font-bold text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase text-[10px]">Estimated Transit</label>
                  <input
                    type="text"
                    value={newCarrierEstDays}
                    onChange={(e) => setNewCarrierEstDays(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-bold text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-500 uppercase text-[10px]">Display Badge</label>
                  <input
                    type="text"
                    value={newCarrierBadge}
                    onChange={(e) => setNewCarrierBadge(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 font-bold text-gray-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-500 uppercase text-[10px]">Carrier Description</label>
                <textarea
                  rows={2}
                  value={newCarrierDesc}
                  onChange={(e) => setNewCarrierDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-2.5 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl font-bold text-gray-600 dark:text-gray-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-650 text-white font-black rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Save & Connect Carrier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURE CARRIER API & WEBHOOK */}
      {selectedConfigProvider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                  Configure {selectedConfigProvider.name} API & Webhooks
                </h3>
                <p className="text-[10px] text-gray-400 font-mono">Carrier ID: {selectedConfigProvider.id}</p>
              </div>
              <button onClick={() => setSelectedConfigProvider(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">API Key / Token</span>
                <div className="flex items-center justify-between font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>{selectedConfigProvider.apiKey || 'dl_live_99201923810293'}</span>
                  <button onClick={() => showToast('API Key copied to clipboard')} className="text-gray-400 hover:text-emerald-500">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">API Base Endpoint</span>
                <p className="font-mono text-gray-900 dark:text-white break-all">
                  {selectedConfigProvider.apiEndpoint || 'https://api.logistics.com/v1'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Webhook Endpoint URL</span>
                <p className="font-mono text-blue-600 dark:text-blue-400 break-all">
                  {selectedConfigProvider.webhookUrl || `https://tradeease.ng/api/webhooks/${selectedConfigProvider.code}`}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Webhook Signing Secret</span>
                <p className="font-mono text-gray-800 dark:text-gray-200">
                  {selectedConfigProvider.webhookSecret || 'whsec_secret_key_88192'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedConfigProvider(null)}
                className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
