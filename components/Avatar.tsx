
import React from 'react';
import { User, UserRole } from '../types';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  onClick?: (user: User) => void;
}

const Avatar: React.FC<AvatarProps> = ({ user, size = 'md', showBadge = true, onClick }) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const getRoleBadge = () => {
    switch(user.role) {
      case UserRole.HOST:
        return { char: 'H', color: 'bg-indigo-600', label: 'Host' };
      case UserRole.MODERATOR:
        return { char: 'M', color: 'bg-green-500', label: 'Mod' };
      case UserRole.ADVERTISER:
        return { char: 'A', color: 'bg-orange-500', label: 'Ads' };
      default:
        return null;
    }
  };

  const badge = getRoleBadge();

  return (
    <div 
      className="relative flex flex-col items-center cursor-pointer group"
      onClick={() => onClick?.(user)}
    >
      <div className={`${sizeClasses[size]} rounded-[40%] overflow-hidden bg-white shadow-md border-2 ${user.handRaised ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-transparent'} group-hover:scale-105 group-hover:shadow-lg transition-all duration-300`}>
        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
      </div>
      
      {showBadge && badge && (
        <div 
          className={`absolute top-0 right-0 ${badge.color} text-white text-[8px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm z-10`}
          title={badge.label}
        >
          {badge.char}
        </div>
      )}

      {/* Hand Raised Indicator */}
      {user.handRaised && (
        <div className="absolute top-0 left-0 bg-indigo-500 text-white text-[10px] w-7 h-7 flex items-center justify-center rounded-full border-2 border-white shadow-xl z-20 animate-bounce">
           ✋
        </div>
      )}
      
      {user.isMuted && (
        <div className="absolute bottom-6 right-0 bg-white rounded-full p-1 shadow-sm border border-gray-200 z-10">
           <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a3 3 0 00-3 3v2a3 3 0 006 0V5a3 3 0 00-3-3zM5 8a1 1 0 011-1h1V5a3 3 0 116 0v2h1a1 1 0 110 2h-1v2a3 3 0 01-3 3v2h-2v-2a3 3 0 01-3-3V9H5a1 1 0 01-1-1z" /><path fillRule="evenodd" d="M3.293 3.293a1 1 0 011.414 0L16.707 15.293a1 1 0 01-1.414 1.414l-12-12a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </div>
      )}

      <p className="mt-2 text-xs font-medium text-gray-800 text-center truncate w-24">
        {user.name.split(' ')[0]}
      </p>
    </div>
  );
};

export default Avatar;
