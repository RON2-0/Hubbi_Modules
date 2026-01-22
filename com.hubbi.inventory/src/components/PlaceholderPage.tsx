import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
    title: string;
    description?: string;
}

export function PlaceholderPage({ title, description = "Esta funcionalidad está en desarrollo." }: PlaceholderPageProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-hubbi-dim p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="bg-hubbi-card p-6 rounded-2xl border border-hubbi-border shadow-xl mb-6">
                <Construction size={48} className="text-hubbi-primary mb-0 mx-auto" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl font-bold text-hubbi-text mb-3 tracking-tight">{title}</h2>
            <p className="text-lg max-w-md mx-auto text-hubbi-dim/80">{description}</p>
        </div>
    );
}
