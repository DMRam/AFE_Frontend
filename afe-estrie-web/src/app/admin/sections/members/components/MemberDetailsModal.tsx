import { 
    X, Edit, Trash2, User, Mail, Phone, MapPin, Calendar, 
    Tag, CreditCard, Globe, CalendarDays, FileText, Home, 
    Users, Settings 
} from "lucide-react";
import type { Member } from "../../../../../services/membersRepo";

interface MemberDetailsModalProps {
    member: Member;
    onClose: () => void;
    onEdit: (member: Member) => void;
    onDelete: (member: Member) => void;
}

export function MemberDetailsModal({ 
    member, 
    onClose, 
    onEdit, 
    onDelete 
}: MemberDetailsModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            
            <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="border-b border-gray-100">
                    <div className="flex items-start justify-between p-4 sm:p-6">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="relative">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 sm:h-14 sm:w-14">
                                    <span className="text-lg font-semibold text-blue-600 sm:text-xl">
                                        {member.fullName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                            </div>
                            
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                                    {member.fullName}
                                    {member.age && <span className="ml-2 text-sm font-normal text-gray-600">({member.age} ans)</span>}
                                </h2>
                                <p className="mt-1 text-sm text-gray-600 break-all">{member.email}</p>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${member.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        <div className={`h-1.5 w-1.5 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`} />
                                        {member.status === 'active' ? 'Actif' : 'Inactif'}
                                    </span>
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                        {member.city}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        ID: <span className="font-mono">{member.id.slice(0, 8)}...</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <button
                            onClick={onClose}
                            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                            aria-label="Fermer"
                        >
                            <X className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>
                    
                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2 sm:px-6">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-600">
                                Membre depuis {member.createdAt || '—'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    onClose();
                                    onEdit(member);
                                }}
                                className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Edit className="h-3.5 w-3.5" />
                                Modifier
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm(`Voulez-vous vraiment supprimer ${member.fullName} ?`)) {
                                        onDelete(member);
                                        onClose();
                                    }
                                }}
                                className="flex items-center gap-1 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Content */}
                <div className="max-h-[calc(80vh-140px)] overflow-y-auto p-4 sm:p-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="rounded-lg bg-blue-50 p-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Informations personnelles</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">Nom complet</span>
                                        </div>
                                        <span className="font-medium text-gray-900">{member.fullName}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">Ville</span>
                                        </div>
                                        <span className="font-medium text-gray-900">{member.city}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">Âge</span>
                                        </div>
                                        <span className="font-medium text-gray-900">{member.age || "—"}</span>
                                    </div>
                                    
                                    {/* Additional profile fields */}
                                    {member.profile?.postalCode && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Code postal</span>
                                            </div>
                                            <span className="font-medium text-gray-900">{member.profile.postalCode}</span>
                                        </div>
                                    )}
                                    
                                    {member.profile?.province && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Province</span>
                                            </div>
                                            <span className="font-medium text-gray-900">{member.profile.province}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Tags */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="rounded-lg bg-purple-50 p-2">
                                        <Tag className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Étiquettes</h3>
                                </div>
                                
                                {member.tags?.length ? (
                                    <div className="flex flex-wrap gap-2">
                                        {member.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
                                            >
                                                <Tag className="h-3 w-3" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <Tag className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                        <p className="text-sm text-gray-500">Aucune étiquette attribuée</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Volunteer Areas */}
                            {member.volunteerAreas && member.volunteerAreas.length > 0 && (
                                <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="rounded-lg bg-green-50 p-2">
                                            <Users className="h-5 w-5 text-green-600" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">Zones de bénévolat</h3>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2">
                                        {member.volunteerAreas.map((area) => (
                                            <span
                                                key={area}
                                                className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700"
                                            >
                                                <Users className="h-3 w-3" />
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Contact Information */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="rounded-lg bg-green-50 p-2">
                                        <Mail className="h-5 w-5 text-green-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Contact</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">Email</span>
                                        </div>
                                        <a 
                                            href={`mailto:${member.email}`}
                                            className="font-medium text-blue-600 hover:text-blue-700 hover:underline break-all"
                                        >
                                            {member.email}
                                        </a>
                                    </div>
                                    
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">Téléphone</span>
                                        </div>
                                        {member.profile?.phone ? (
                                            <a 
                                                href={`tel:${member.profile.phone}`}
                                                className="font-medium text-gray-900 hover:text-blue-600"
                                            >
                                                {member.profile.phone}
                                            </a>
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">Langue</span>
                                        </div>
                                        <span className="font-medium text-gray-900">
                                            {member.profile?.preferredLanguage || "—"}
                                        </span>
                                    </div>
                                    
                                    {/* Additional contact fields */}
                                    {member.profile?.addressLine1 && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <Home className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-600">Adresse</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-medium text-gray-900">{member.profile.addressLine1}</span>
                                                {member.profile.addressLine2 && (
                                                    <span className="block text-sm text-gray-600">{member.profile.addressLine2}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Membership Information */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="rounded-lg bg-amber-50 p-2">
                                        <CreditCard className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Abonnement</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-sm text-gray-600">Plan</span>
                                        {member.membership?.planName ? (
                                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                                                {member.membership.planName}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-sm text-gray-600">Statut paiement</span>
                                        {member.membership?.paymentStatus ? (
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${member.membership.paymentStatus === 'paid' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : member.membership.paymentStatus === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {member.membership.paymentStatus}
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-400">—</span>
                                        )}
                                    </div>
                                    
                                    {member.membership?.activatedAt && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <span className="text-sm text-gray-600">Activé le</span>
                                            <span className="font-medium text-gray-900">
                                                {member.membership.activatedAt}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {member.membership?.mode && (
                                        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <span className="text-sm text-gray-600">Mode</span>
                                            <span className="font-medium text-gray-900">{member.membership.mode}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Preferences & Consent */}
                            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="rounded-lg bg-indigo-50 p-2">
                                        <Settings className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900">Préférences</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-gray-600">Consentement RGPD</span>
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${member.profile?.consent
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {member.profile?.consent ? 'Oui' : 'Non'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-gray-600">Newsletter</span>
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${member.profile?.newsletterOptIn
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {member.profile?.newsletterOptIn ? 'Activée' : 'Désactivée'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-sm text-gray-600">Bénévolat</span>
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${member.profile?.wantsToVolunteer
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {member.profile?.wantsToVolunteer ? 'Intéressé' : 'Non'}
                                        </span>
                                    </div>
                                    
                                    {member.profile?.heardAbout && (
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm text-gray-600">Comment nous a-t-il connu</span>
                                            <span className="font-medium text-gray-900">{member.profile.heardAbout}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Notes Section */}
                    {member.profile?.notes && (
                        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="rounded-lg bg-gray-50 p-2">
                                    <FileText className="h-5 w-5 text-gray-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900">Notes</h3>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{member.profile.notes}</p>
                        </div>
                    )}
                    
                    {/* Updated At */}
                    {member.updatedAt && (
                        <div className="mt-4 text-xs text-gray-500 text-right">
                            Dernière mise à jour: {member.updatedAt}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}