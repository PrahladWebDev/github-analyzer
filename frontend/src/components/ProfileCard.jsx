export default function ProfileCard({ profile, stats }) {
  return (
    <div className="card flex flex-col sm:flex-row gap-5 items-start sm:items-center">
      <img
        src={profile.avatarUrl}
        alt={profile.login}
        className="w-24 h-24 rounded-full border border-border"
      />
      <div className="flex-1">
        <h2 className="text-xl font-semibold">{profile.name || profile.login}</h2>
        <p className="text-accent">@{profile.login}</p>
        {profile.bio && <p className="text-gray-400 mt-1 text-sm">{profile.bio}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
          <Stat label="Followers" value={profile.followers} />
          <Stat label="Following" value={profile.following} />
          <Stat label="Public repos" value={profile.publicRepos} />
          <Stat label="Total stars" value={stats.totalStars} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-base border border-border rounded-lg px-3 py-2 text-center">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-gray-500 text-xs">{label}</div>
    </div>
  );
}
