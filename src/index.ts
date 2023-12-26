import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
} from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Livestock = Record<{
  id: string;
  name: string;
  breed: string;
  species: string;
  birthplace_name: string;
  birthplace_address: string;
  birthdate: nat64;
  gender: string;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type LivestockPayload = Record<{
  name: string;
  breed: string;
  species: string;
  birthplace_name: string;
  birthplace_address: string;
  birthdate: nat64;
  gender: string;
}>;

const livestockStorage = new StableBTreeMap<string, Livestock>(0, 44, 1024);

$query
export function getLivestocks(): Result<Vec<Livestock>, string> {
  try {
    return Result.Ok(livestockStorage.values());
  } catch (error) {
    return Result.Err(`Error retrieving livestock: ${error}`);
  }
}

$query
export function getLivestock(id: string): Result<Livestock, string> {
  try {
    if (typeof id !== 'string') {
      return Result.Err(`Invalid ID parameter.`);
    }

    return match(livestockStorage.get(id), {
      Some: (livestock) => Result.Ok<Livestock, string>(livestock),
      None: () => Result.Err<Livestock, string>(`Livestock with ID=${id} not found.`),
    });
  } catch (error) {
    return Result.Err(`Error retrieving livestock by ID: ${error}`);
  }
}

$update
export function addLivestock(payload: LivestockPayload): Result<Livestock, string> {
  try {
    if (!payload.name || !payload.breed || !payload.species || !payload.birthplace_name ||
        !payload.birthplace_address || !payload.birthdate || !payload.gender) {
      return Result.Err<Livestock, string>('Invalid payload');
    }

    const livestock: Livestock = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      name: payload.name,
      breed: payload.breed,
      species: payload.species,
      birthplace_name: payload.birthplace_name,
      birthplace_address: payload.birthplace_address,
      birthdate: payload.birthdate,
      gender: payload.gender,
    };

    livestockStorage.insert(livestock.id, livestock);
    return Result.Ok(livestock);
  } catch (error) {
    return Result.Err(`Failed to add livestock: ${error}`);
  }
}

$update
export function updateLivestock(id: string, payload: LivestockPayload): Result<Livestock, string> {
  try {
    if (typeof id !== 'string') {
      return Result.Err(`Invalid ID parameter.`);
    }

    if (!payload.name || !payload.breed || !payload.species || !payload.birthplace_name ||
        !payload.birthplace_address || !payload.birthdate || !payload.gender) {
      return Result.Err<Livestock, string>('Invalid payload');
    }

    return match(livestockStorage.get(id), {
      Some: (livestock) => {
        const updatedLivestock: Livestock = {
          ...livestock,
          name: payload.name,
          breed: payload.breed,
          species: payload.species,
          birthplace_name: payload.birthplace_name,
          birthplace_address: payload.birthplace_address,
          birthdate: payload.birthdate,
          gender: payload.gender,
          updatedAt: Opt.Some(ic.time()),
        };

        livestockStorage.insert(livestock.id, updatedLivestock);
        return Result.Ok<Livestock, string>(updatedLivestock);
      },
      None: () => Result.Err<Livestock, string>(`Livestock with ID=${id} not found.`),
    });
  } catch (error) {
    return Result.Err(`Failed to update livestock: ${error}`);
  }
}

$update
export function deleteLivestock(id: string): Result<Livestock, string> {
  try {
    if (typeof id !== 'string') {
      return Result.Err(`Invalid ID parameter.`);
    }

    return match(livestockStorage.remove(id), {
      Some: (deletedLivestock) => Result.Ok<Livestock, string>(deletedLivestock),
      None: () => Result.Err<Livestock, string>(`Livestock with ID=${id} not found.`),
    });
  } catch (error) {
    return Result.Err(`Failed to delete livestock: ${error}`);
  }
}
 

// Cryptographic utility for generating random values
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};
