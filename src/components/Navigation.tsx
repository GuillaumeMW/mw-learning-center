import { Link } from "react-router-dom";
import UserMenu from "./UserMenu";
import movingWaldoLogo from "@/assets/movingwaldo-logo.svg";

const Navigation = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src={movingWaldoLogo} 
            alt="MovingWaldo" 
            className="h-8 w-auto"
          />
        </Link>
        
        <UserMenu />
      </div>
    </nav>
  );
};

export default Navigation;