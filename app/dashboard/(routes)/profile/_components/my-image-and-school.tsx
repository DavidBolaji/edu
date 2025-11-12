'use client';

import { reload } from '@/action/action';
import Spinner from '@/app/_components/ui/spinner';
import useUpload from '@/app/_hooks/use-upload';
import { focusFace } from '@/app/_lib/utils';
import { UserDetail } from '@/src/entities/models/user';

import { CameraIcon, Plus, User2 } from 'lucide-react';
import Image from 'next/image';
import React, { ChangeEvent, useRef } from 'react';

const MyImageAndSchool: React.FC<{ user: UserDetail; edit?: boolean }> = ({
  user,
  edit = true,
}) => {
  const uri = user?.picture ? focusFace(user?.picture) : '';
  const btnRef = useRef<HTMLInputElement | null>(null);

  const { handleUpload, isUploading } = useUpload({
    cb: () => {
      const t = setTimeout(() => {
        reload('/dashboard/profile');
        clearTimeout(t);
      }, 500);
    },
  });

  const triggerChange = () => {
    btnRef.current?.click();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <form className="items-center flex-col justify-center">
      <div
        className="flex items-center w-1/4 mx-auto justify-center cursor-pointer"
        onClick={edit ? triggerChange : undefined}
      >
        <input
          className="hidden"
          type="file"
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleChange}
          ref={btnRef}
        />
        <button className="hidden" type="button"></button>
        {user?.picture ? (
          <div className="group relative">
            {isUploading ? (
              <div className="absolute ml-2 mt-2 inset-1/4">
                <Spinner />
              </div>
            ) : null}
            {!isUploading ? (
              <div className="group-hover:flex w-full h-full rounded-full hidden absolute bg-black/75 items-center justify-center">
                <Plus color="white" />
              </div>
            ) : null}
            <Image
              src={user?.picture}
              width={100}
              height={100}
              alt="profile pic"
              className="object-cover w-24 h-24 rounded-full"
            />
          </div>
        ) : (
          <div className="relative w-24 group h-24 bg-gray-300 rounded-full flex items-center justify-center">
            {isUploading ? (
              <div className="absolute">
                <Spinner />
              </div>
            ) : null}
            {!isUploading ? (
              <div className="group-hover:flex w-full h-full rounded-full hidden absolute bg-black/75 items-center justify-center">
                <Plus color="white" />
              </div>
            ) : null}
            <User2 name="person" size={30} />
            {edit ?? (
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <CameraIcon size={18} />
              </div>
            )}
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold mt-4 w-full flex items-center justify-center">
        {user?.title || 'Mr'} {user?.fname} {user?.lname}
      </h2>

      <h2 className="text-sm text-gray-700 w-full text-center my-1 flex justify-center items-center ">
        {user?.role} at {user?.school}
      </h2>
    </form>
  );
};

export default MyImageAndSchool;
