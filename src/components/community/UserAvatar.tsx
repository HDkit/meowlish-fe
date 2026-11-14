'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/components/ui/utils';
import { type Identity, displayName, initialsOf } from '@/lib/identity-cache';

interface UserAvatarProps {
  identity?: Identity;
  className?: string;
}

export function UserAvatar({ identity, className }: UserAvatarProps) {
  const name = displayName(identity);
  return (
    <Avatar className={cn('size-9 border border-emerald-100 bg-emerald-50', className)}>
      {identity?.avatarUrl && <AvatarImage src={identity.avatarUrl} alt="" />}
      <AvatarFallback className="bg-emerald-50 text-xs font-semibold text-emerald-700" aria-hidden="true">
        {identity ? initialsOf(name) : ''}
      </AvatarFallback>
    </Avatar>
  );
}
