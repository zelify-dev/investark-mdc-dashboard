"use client";

import React, { useEffect, useState } from "react";
import { RecentActivityList } from "../components/recent-activity-list";
import { TaskList } from "../components/task-list";
import { FavoriteViews } from "../components/favorite-views";
import { CompanyIndicators } from "../components/company-indicators";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import { dashboardService } from "../services/dashboard.service";
import { DashboardData } from "../types/dashboard.types";

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await dashboardService.getDashboardData();
        setData(result);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="zelify-workspace-page">
        <ZelifyTopNavbar />
        <div className="zelify-workspace-page__loading">
          <div className="zelify-workspace-page__spinner" aria-hidden />
          <span>Updating your dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">Operational Dashboard</h1>
          <p className="zelify-workspace-page__subtitle">
            Welcome back. Here&apos;s a summary of the system activity.
          </p>

          <div className="zelify-workspace-page__grid-2">
            <div className="zelify-workspace-page__col-main">
              <RecentActivityList activities={data.activities} />
            </div>

            <div className="zelify-workspace-page__col-side">
              <TaskList tasks={data.tasks} />
              <FavoriteViews favorites={data.favorites} />
              <CompanyIndicators indicators={data.indicators} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
