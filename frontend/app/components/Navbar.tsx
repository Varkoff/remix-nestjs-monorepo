import { Link } from '@remix-run/react';
import { Bell, ReceiptEuro, UserRound } from 'lucide-react';
import { useOptionalUser } from '~/root';

export const Navbar = ({ logo }: { logo: string }) => {
    const user = useOptionalUser();
    return (
        <nav className='px-3 py-2 bg-bleu text-white flex justify-between items-center'>
            <Link to='/'>
                <img src={logo} className='w-full h-auto max-w-[120px]' />
            </Link>
            <div className='flex gap-2 items-center'>
                {user ? (
                    <>
                        <span className='text-xs'>{user.name}</span>
                        <Link className='text-xs' to='/transactions'>
                            Demandes
                        </Link>
                        <Link className='text-xs' to='/my-services'>
                            <ReceiptEuro className='flex-shrink-0' />
                        </Link>
                        <Link className='text-xs' to='/'>
                            <Bell className='fill-white flex-shrink-0' />
                        </Link>
                        <Link className='text-xs' to='/profile'>
                            <UserRound className='flex-shrink-0' />
                        </Link>
                        <form method='POST' action='/auth/logout'>
                            <button type='submit' className='text-xs'>Se déconnecter</button>
                        </form>
                    </>
                ) : (
                    <>
                        <Link className='text-xs' to='/login'>Connexion</Link>
                        <Link className='text-xs' to='/register'>Inscription</Link>
                    </>
                )}
            </div>
        </nav>
    );
};
