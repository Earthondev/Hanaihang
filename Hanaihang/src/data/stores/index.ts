import { centralRama3Stores } from './central-rama-3';
import { siamParagonStores } from './siam-paragon';
import { centralWorldStores } from './central-world';
import { iconsiamStores } from './iconsiam';
import { emquartierStores } from './emquartier';
import { siamCenterStores } from './siam-center';
import { siamDiscoveryStores } from './siam-discovery';
import { centralEmbassyStores } from './central-embassy';
import { centralChidlomStores } from './central-chidlom';
import { terminal21AsokStores } from './terminal-21-asok';

export const staticStores: Record<string, any[]> = {
    'central-rama-3': centralRama3Stores,
    'siam-paragon': siamParagonStores,
    'central-world': centralWorldStores,
    'iconsiam': iconsiamStores,
    'emquartier': emquartierStores,
    'siam-center': siamCenterStores,
    'siam-discovery': siamDiscoveryStores,
    'central-embassy': centralEmbassyStores,
    'central-chidlom': centralChidlomStores,
    'terminal-21-asok': terminal21AsokStores,
};

export function getStaticStores(mallId: string) {
    return staticStores[mallId] || [];
}
