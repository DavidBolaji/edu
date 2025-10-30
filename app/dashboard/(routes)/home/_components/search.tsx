'use client';

import { handleSearch } from '@/app/dashboard/action';
import { Input } from 'antd';
import React, { FormEvent } from 'react';

const Search = () => {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const value = formData.get('search');
    formData.set('search', value as string);
    handleSearch(formData);
  };
  return (
    <form onSubmit={onSubmit}>
      <Input.Search
        placeholder="Search educator by first name or email"
        size="large"
        name="search"
        className="rounded font-space-mono"
      />
    </form>
  );
};

export default Search;
