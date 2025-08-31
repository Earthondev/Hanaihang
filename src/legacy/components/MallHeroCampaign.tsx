import React from 'react';

interface CampaignProps {
  campaign: any;
}

const MallHeroCampaign: React.FC<CampaignProps> = ({ campaign }) => {
  if (!campaign) return null;

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden bg-gradient-to-r ${campaign.theme?.bg || "from-emerald-50 to-teal-50"} mb-6`}>
      <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs rounded-lg bg-pink-100 text-pink-700`}>
              {campaign.tags?.[0] || "Campaign"}
            </span>
            <span className="text-gray-600 text-sm">
              {campaign.timeNote}
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">{campaign.title}</h2>
          <p className="text-gray-600">{campaign.subtitle}</p>
          <p className="text-gray-600 mt-2">{campaign.short}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {campaign.hashtags?.slice(0, 4).map((hashtag: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                {hashtag}
              </span>
            ))}
          </div>
        </div>
        <div className="w-full md:w-72 aspect-video bg-white/60 rounded-xl overflow-hidden flex items-center justify-center">
          <span className="text-gray-600 text-sm">Campaign Visual</span>
        </div>
      </div>
    </div>
  );
};

export default MallHeroCampaign;
