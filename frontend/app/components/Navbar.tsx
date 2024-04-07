import { Link } from "@remix-run/react";
import { Bell, ReceiptEuro, UserRound } from "lucide-react";

export const Navbar = ({ logo }: { logo: string }) => {
    return (<nav className='px-3 py-2 bg-bleu text-white flex justify-between items-center'>
        <img src={logo} className='w-full h-auto max-w-[120px]' />
        <div className='flex gap-2'>
            <Link to='/'><ReceiptEuro className="flex-shrink-0" /></Link>
            <Link to='/'><Bell className="fill-white flex-shrink-0" /></Link>
            <Link to='/'><UserRound className="flex-shrink-0" /></Link>
        </div>
    </nav>)
}