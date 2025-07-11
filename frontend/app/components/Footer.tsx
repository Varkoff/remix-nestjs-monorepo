import { Link } from '@remix-run/react';

export const Footer = () => {
    return (
        <footer className='mt-auto bg-lightTurquoise px-6 py-4'>
            <div className='max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4'>
                <div className='text-sm text-bleu'>
                    © 2024 Coup de Pouce. Tous droits réservés.
                </div>
                
                <div className='flex items-center gap-4 text-sm'>
                    <Link 
                        to='/mentions-legales' 
                        className='text-bleu hover:text-persianIndigo transition-colors'
                    >
                        Mentions légales
                    </Link>
                    <span className='text-bleu'>•</span>
                    <Link 
                        to='/cgv' 
                        className='text-bleu hover:text-persianIndigo transition-colors'
                    >
                        CGV
                    </Link>
                </div>
            </div>
        </footer>
    );
};