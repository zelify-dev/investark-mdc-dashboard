"use client";

import React from "react";
import { Search, Filter, Home, ChevronDown } from "lucide-react";

import "./group-filters.css";

export const GroupFilters: React.FC = () => {
  return (
    <div className="zelify-group-filters">
      {/* Branch Mockup (Premium Aesthetic) */}
      <div className="zelify-group-filters__branch">
        <Home size={16} />
        <span>Branch</span>
        <span className="zelify-group-filters__branch-label">All Branches</span>
        <ChevronDown size={16} />
      </div>

      <div className="zelify-group-filters__search">
        <Search size={18} className="zelify-group-filters__search-icon" />
        <input 
          type="text" 
          placeholder="Search groups by name or ID..." 
          className="zelify-group-filters__input"
        />
      </div>

      <div className="zelify-group-filters__actions">
        <button className="zelify-group-filters__btn">
          <Filter size={16} style={{ marginRight: '8px' }} />
          Filter
        </button>
      </div>
    </div>
  );
};
