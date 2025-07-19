export const fetchLatestVersion = async () => {
    const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    if (!response.ok) {
        throw new Error('Failed to fetch the latest version');
    }
    const versions = await response.json();
    return versions[0];
}