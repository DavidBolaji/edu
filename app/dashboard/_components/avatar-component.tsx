import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/app/_components/ui/avatar';
import React from 'react';

const AvatarComponent: React.FC<{ src: string | null; name: string }> = ({
  src,
  name,
}) => {
  return (
    <Avatar>
      <AvatarImage src={src ? src : 'https://github.com/vercel.png'} />
      <AvatarFallback>{name.split('')[0].toUpperCase()}</AvatarFallback>
    </Avatar>
  );
};

export default AvatarComponent;
