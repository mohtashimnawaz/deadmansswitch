/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/deadmansswitch.json`.
 */
export type Deadmansswitch = {
  "address": "BUE3LbNV3jkqGwE1E1ouvka3pcHuDvpLw4u9WT8oexxr",
  "metadata": {
    "name": "deadmansswitch",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "cancelSwitch",
      "docs": [
        "Cancel the switch and return funds to owner"
      ],
      "discriminator": [
        126,
        108,
        235,
        9,
        11,
        164,
        232,
        178
      ],
      "accounts": [
        {
          "name": "switch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  105,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "switchId"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "switch"
          ]
        }
      ],
      "args": [
        {
          "name": "switchId",
          "type": "string"
        }
      ]
    },
    {
      "name": "distributeAsset",
      "docs": [
        "Distribute specific asset amount to beneficiary (enhanced version)"
      ],
      "discriminator": [
        117,
        26,
        134,
        108,
        27,
        159,
        126,
        102
      ],
      "accounts": [
        {
          "name": "switch",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  105,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "switch.owner",
                "account": "switch"
              },
              {
                "kind": "account",
                "path": "switch.switch_id",
                "account": "switch"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "switch.owner",
                "account": "switch"
              },
              {
                "kind": "account",
                "path": "switch.switch_id",
                "account": "switch"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true
        },
        {
          "name": "beneficiary",
          "writable": true
        },
        {
          "name": "beneficiaryTokenAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "assetType",
          "type": {
            "defined": {
              "name": "assetType"
            }
          }
        }
      ]
    },
    {
      "name": "distributeSol",
      "docs": [
        "Distribute SOL from escrow to beneficiaries"
      ],
      "discriminator": [
        234,
        85,
        98,
        176,
        165,
        8,
        133,
        95
      ],
      "accounts": [
        {
          "name": "switch",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  105,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "switch.owner",
                "account": "switch"
              },
              {
                "kind": "account",
                "path": "switch.switch_id",
                "account": "switch"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "switch.owner",
                "account": "switch"
              },
              {
                "kind": "account",
                "path": "switch.switch_id",
                "account": "switch"
              }
            ]
          }
        },
        {
          "name": "beneficiary",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "distributeSpl",
      "docs": [
        "Distribute SPL tokens from escrow to beneficiaries"
      ],
      "discriminator": [
        93,
        24,
        158,
        238,
        198,
        173,
        215,
        228
      ],
      "accounts": [
        {
          "name": "switch",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  105,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "switch.owner",
                "account": "switch"
              },
              {
                "kind": "account",
                "path": "switch.switch_id",
                "account": "switch"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "switch.owner",
                "account": "switch"
              },
              {
                "kind": "account",
                "path": "switch.switch_id",
                "account": "switch"
              }
            ]
          }
        },
        {
          "name": "escrowTokenAccount",
          "writable": true
        },
        {
          "name": "beneficiary"
        },
        {
          "name": "beneficiaryTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "initializeSwitch",
      "docs": [
        "Initialize a new Dead Man's Switch with a unique ID"
      ],
      "discriminator": [
        107,
        163,
        228,
        58,
        254,
        106,
        204,
        46
      ],
      "accounts": [
        {
          "name": "switch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  105,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "switchId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "switchId"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "switchId",
          "type": "string"
        },
        {
          "name": "timeoutSeconds",
          "type": "i64"
        },
        {
          "name": "beneficiaries",
          "type": {
            "vec": {
              "defined": {
                "name": "beneficiary"
              }
            }
          }
        },
        {
          "name": "tokenType",
          "type": {
            "defined": {
              "name": "tokenType"
            }
          }
        }
      ]
    },
    {
      "name": "initializeSwitchWithAssets",
      "docs": [
        "Initialize a switch with specific asset allocations (enhanced version)"
      ],
      "discriminator": [
        227,
        144,
        50,
        91,
        115,
        209,
        126,
        97
      ],
      "accounts": [
        {
          "name": "switch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  105,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "switchId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "switchId"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "switchId",
          "type": "string"
        },
        {
          "name": "timeoutSeconds",
          "type": "i64"
        },
        {
          "name": "allocations",
          "type": {
            "vec": {
              "defined": {
                "name": "beneficiaryAllocation"
              }
            }
          }
        }
      ]
    },
    {
      "name": "sendHeartbeat",
      "docs": [
        "Send a heartbeat to extend the deadline"
      ],
      "discriminator": [
        75,
        63,
        64,
        229,
        162,
        200,
        239,
        43
      ],
      "accounts": [
        {
          "name": "switch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  105,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "switchId"
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "switch"
          ]
        }
      ],
      "args": [
        {
          "name": "switchId",
          "type": "string"
        }
      ]
    },
    {
      "name": "triggerExpiry",
      "docs": [
        "Trigger expiry and distribute funds to beneficiaries"
      ],
      "discriminator": [
        152,
        217,
        89,
        33,
        247,
        243,
        133,
        41
      ],
      "accounts": [
        {
          "name": "switch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  105,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "switch.owner",
                "account": "switch"
              },
              {
                "kind": "arg",
                "path": "switchId"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "switchId",
          "type": "string"
        }
      ]
    },
    {
      "name": "withdrawSol",
      "docs": [
        "Withdraw SOL after cancellation"
      ],
      "discriminator": [
        145,
        131,
        74,
        136,
        65,
        137,
        42,
        38
      ],
      "accounts": [
        {
          "name": "switch",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  105,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "switchId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              },
              {
                "kind": "arg",
                "path": "switchId"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true,
          "relations": [
            "switch"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "switchId",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "switch",
      "discriminator": [
        242,
        175,
        214,
        214,
        230,
        53,
        61,
        158
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidSwitchId",
      "msg": "Invalid switch ID (1-32 characters allowed)"
    },
    {
      "code": 6001,
      "name": "invalidBeneficiaryCount",
      "msg": "Invalid number of beneficiaries (1-10 allowed)"
    },
    {
      "code": 6002,
      "name": "invalidShareDistribution",
      "msg": "Beneficiary shares must sum to 10000 basis points (100%)"
    },
    {
      "code": 6003,
      "name": "invalidTimeout",
      "msg": "Timeout must be positive"
    },
    {
      "code": 6004,
      "name": "switchNotActive",
      "msg": "Switch is not active"
    },
    {
      "code": 6005,
      "name": "deadlineNotPassed",
      "msg": "Deadline has not passed yet"
    },
    {
      "code": 6006,
      "name": "switchNotExpired",
      "msg": "Switch has not expired"
    },
    {
      "code": 6007,
      "name": "switchNotCanceled",
      "msg": "Switch has not been canceled"
    },
    {
      "code": 6008,
      "name": "switchAlreadyExpired",
      "msg": "Switch has already expired - heartbeat rejected"
    },
    {
      "code": 6009,
      "name": "invalidTokenType",
      "msg": "Invalid token type for this operation"
    },
    {
      "code": 6010,
      "name": "insufficientFunds",
      "msg": "Insufficient funds in escrow"
    },
    {
      "code": 6011,
      "name": "beneficiaryNotFound",
      "msg": "Beneficiary not found"
    },
    {
      "code": 6012,
      "name": "invalidAssetAllocation",
      "msg": "Invalid asset allocation - beneficiary must have at least one asset"
    }
  ],
  "types": [
    {
      "name": "assetAllocation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "assetType",
            "type": {
              "defined": {
                "name": "assetType"
              }
            }
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "assetType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "sol"
          },
          {
            "name": "splToken",
            "fields": [
              {
                "name": "mint",
                "type": "pubkey"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "beneficiary",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "shareBps",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "beneficiaryAllocation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "assets",
            "type": {
              "vec": {
                "defined": {
                  "name": "assetAllocation"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "switch",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "switchId",
            "type": "string"
          },
          {
            "name": "beneficiaries",
            "type": {
              "vec": {
                "defined": {
                  "name": "beneficiary"
                }
              }
            }
          },
          {
            "name": "tokenType",
            "type": {
              "defined": {
                "name": "tokenType"
              }
            }
          },
          {
            "name": "timeoutSeconds",
            "type": "i64"
          },
          {
            "name": "heartbeatDeadline",
            "type": "i64"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "switchStatus"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "switchStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "active"
          },
          {
            "name": "expired"
          },
          {
            "name": "canceled"
          }
        ]
      }
    },
    {
      "name": "tokenType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "sol"
          },
          {
            "name": "spl",
            "fields": [
              {
                "name": "mint",
                "type": "pubkey"
              }
            ]
          }
        ]
      }
    }
  ]
};
