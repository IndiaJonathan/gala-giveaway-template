import type { TokenClassKeyProperties } from '@gala-chain/api';

/**
 * Interface for a claimable win from a giveaway
 */
export interface ClaimableWin {
  /** Unique identifier for the win */
  _id: string;
  
  /** Amount of tokens won */
  amountWon: number;
  
  /** GalaChain address of the winner */
  gcAddress: string;
  
  /** Whether the win has been claimed */
  claimed: boolean;
  
  /** MongoDB version field */
  __v: number;
  
  /** Giveaway details */
  giveaway: {
    /** End date and time of the giveaway */
    endDateTime: string;
    
    /** Type of the giveaway */
    giveawayType: string;
    
    /** Token class properties of the token that was won */
    giveawayToken: TokenClassKeyProperties;
    
    /** Quantity of tokens given away */
    tokenQuantity: string;
    
    /** Creator ID of the giveaway */
    creator: string;
    
    /** Token class properties of the token that needs to be burned (if any) */
    burnToken?: TokenClassKeyProperties;
    
    /** Quantity of tokens that need to be burned to claim the win */
    burnTokenQuantity?: string;
  };
  
  /** Date when the win was claimed (if applicable) */
  claimedDate?: string;
}

/**
 * Sample claimable win data structure
 * 
 * {
 *   "_id": "67d0a0900043a6831aae9eed",
 *   "amountWon": 1,
 *   "gcAddress": "eth|59E398c5Aa8Bb155AcEf5eE1Fdd79524116dE4f6",
 *   "claimed": false,
 *   "__v": 0,
 *   "giveaway": {
 *     "endDateTime": "2025-03-11T20:43:26.189Z",
 *     "giveawayType": "DistributedGiveaway",
 *     "giveawayToken": {
 *       "collection": "GALA",
 *       "type": "none",
 *       "category": "Unit",
 *       "additionalKey": "none"
 *     },
 *     "tokenQuantity": "1",
 *     "creator": "67c8cc48613e4b7920b246b0",
 *     "burnToken": {
 *       "collection": "GALA",
 *       "type": "none",
 *       "category": "Unit",
 *       "additionalKey": "none",
 *       "_id": "67d0a04f0043a6831aae9ed9"
 *     },
 *     "burnTokenQuantity": "1"
 *   }
 * }
 */ 