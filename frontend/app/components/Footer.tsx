import { NavLink } from '@remix-run/react';
import { Mail, Plus, Search, Star, Users } from 'lucide-react';

export const Footer = () => {
    return (<footer className='overflow-x-auto px-3 py-2 flex items-center justify-between gap-4 mt-auto bg-lightTurquoise'>
        <FooterLinkItem href='/' icon={<Search />} label='Rechercher' />
        <FooterLinkItem href='/' icon={<Users />} label='Offreurs' />
        <FooterLinkItem href='/' icon={<Plus />} label='Demandes' />
        <FooterLinkItem href='/' icon={<Star />} label='Favoris' />
        <FooterLinkItem href='/' icon={<Mail />} label='Message' />
    </footer>)
};

const FooterLinkItem = ({
    icon,
    label,
    href,
}: {
    label: string;
    icon: React.ReactNode;
    href: string;
}) => {
    return (
        <NavLink
            className={({ isActive }) =>
                `flex flex-col items-center text-sm ${isActive ? 'text-vert' : 'text-bleu'}`
            }
            to={href}
        >
            {icon} <span className="text-bleu">{label}</span>
        </NavLink>
    );
};