var AutoBuy = {};
AutoBuy.buildingsCPS = {};
AutoBuy.CookieBankOverride = -1;

AutoBuy.CookieBank = function () {
    return AutoBuy.CookieBankOverride != -1
        ? AutoBuy.CookieBankOverride
        : 3000 * (Game.Has("Lucky day") + Game.Has("Serendipity"));
};

// Computes the cps and how much it boosts other Buildings
AutoBuy.CPSperBuilding = function () {
    for (const [building, me] of Object.entries(Game.Objects)) {
        // Ripped straight out of the source code.
        // There was a comment that said the math might be off though
        var synergyBoost = 0;
        if (me.amount > 0) {
            var synergiesWith = {};

            if (me.name == "Grandma") {
                for (var i in Game.GrandmaSynergies) {
                    if (Game.Has(Game.GrandmaSynergies[i])) {
                        var other =
                            Game.Upgrades[Game.GrandmaSynergies[i]].buildingTie;
                        var mult = me.amount * 0.01 * (1 / (other.id - 1));
                        var boost =
                            other.storedTotalCps * Game.globalCpsMult -
                            (other.storedTotalCps * Game.globalCpsMult) /
                                (1 + mult);
                        synergyBoost += boost;
                        if (!synergiesWith[other.plural])
                            synergiesWith[other.plural] = 0;
                        synergiesWith[other.plural] += mult;
                    }
                }
            } else if (me.name == "Portal" && Game.Has("Elder Pact")) {
                var other = Game.Objects["Grandma"];
                var boost =
                    me.amount * 0.05 * other.amount * Game.globalCpsMult;
                synergyBoost += boost;
                if (!synergiesWith[other.plural])
                    synergiesWith[other.plural] = 0;
                synergiesWith[other.plural] +=
                    boost / (other.storedTotalCps * Game.globalCpsMult);
            }

            for (var i in me.synergies) {
                var it = me.synergies[i];
                if (Game.Has(it.name)) {
                    var weight = 0.05;
                    var other = it.buildingTie1;
                    if (me == it.buildingTie1) {
                        weight = 0.001;
                        other = it.buildingTie2;
                    }
                    var boost =
                        other.storedTotalCps * Game.globalCpsMult -
                        (other.storedTotalCps * Game.globalCpsMult) /
                            (1 + me.amount * weight);
                    synergyBoost += boost;
                    if (!synergiesWith[other.plural])
                        synergiesWith[other.plural] = 0;
                    synergiesWith[other.plural] += me.amount * weight;
                }
            }
        }
        AutoBuy.buildingsCPS[building] = me.storedTotalCps + synergyBoost;
    }
};

// Computes the cps per cookie spent for every building
AutoBuy.CPSPCperBuilding = function () {
    var buildings = {};
    for (const [building, me] of Object.entries(Game.Objects)) {
        // Ripped straight out of the source code.
        // There was a comment that said the math might be off though
        if (me.amount > 0) {
            var synergiesWith = {};
            var synergyBoost = 0;

            if (me.name == "Grandma") {
                for (var i in Game.GrandmaSynergies) {
                    if (Game.Has(Game.GrandmaSynergies[i])) {
                        var other =
                            Game.Upgrades[Game.GrandmaSynergies[i]].buildingTie;
                        var mult = me.amount * 0.01 * (1 / (other.id - 1));
                        var boost =
                            other.storedTotalCps * Game.globalCpsMult -
                            (other.storedTotalCps * Game.globalCpsMult) /
                                (1 + mult);
                        synergyBoost += boost;
                        if (!synergiesWith[other.plural])
                            synergiesWith[other.plural] = 0;
                        synergiesWith[other.plural] += mult;
                    }
                }
            } else if (me.name == "Portal" && Game.Has("Elder Pact")) {
                var other = Game.Objects["Grandma"];
                var boost =
                    me.amount * 0.05 * other.amount * Game.globalCpsMult;
                synergyBoost += boost;
                if (!synergiesWith[other.plural])
                    synergiesWith[other.plural] = 0;
                synergiesWith[other.plural] +=
                    boost / (other.storedTotalCps * Game.globalCpsMult);
            }

            for (var i in me.synergies) {
                var it = me.synergies[i];
                if (Game.Has(it.name)) {
                    var weight = 0.05;
                    var other = it.buildingTie1;
                    if (me == it.buildingTie1) {
                        weight = 0.001;
                        other = it.buildingTie2;
                    }
                    var boost =
                        other.storedTotalCps * Game.globalCpsMult -
                        (other.storedTotalCps * Game.globalCpsMult) /
                            (1 + me.amount * weight);
                    synergyBoost += boost;
                    if (!synergiesWith[other.plural])
                        synergiesWith[other.plural] = 0;
                    synergiesWith[other.plural] += me.amount * weight;
                }
            }

            buildings[building] =
                (me.storedCps * Game.globalCpsMult + synergyBoost / me.amount) /
                me.getPrice();
        } else {
            buildings[building] =
                ((building == "Cursor" ? 0.1 : me.baseCps) *
                    Game.globalCpsMult) /
                me.getPrice();
        }
    }
    return buildings;
};

const heavenly = {
    129: 0.0005,
    130: 0.002,
    131: 0.0025,
    132: 0.0025,
    133: 0.0025,
};

// Computes the cps per cookie spent for every Upgrade in store
AutoBuy.CPSPCperUpgrade = function () {
    var upgrades = {};
    for (const upgrade of Game.UpgradesInStore) {
        if (upgrade.pool == "cookie") {
            // Cookie flavor upgrade
            upgrades[upgrade.id] =
                (Game.cookiesPsRaw * (0.01 * upgrade.power)) /
                upgrade.getPrice();
            continue;
        }
        if (heavenly[upgrade.id]) {
            // Heavenly
            upgrades[upgrade.id] =
                (Game.cookiesPsRaw * heavenly[upgrade.id] * Game.prestige) /
                upgrade.getPrice();
            continue;
        }
        if (upgrade.id <= 2) {
            // Cursor and Mouse
            upgrade[upgrade.id] =
                (Game.computedMouseCps * 20 +
                    Game.Objects.Cursor.storedTotalCps * Game.globalCpsMult) /
                upgrade.getPrice();
            continue;
        }
        if (typeof upgrade.buildingTie == "object") {
            // Tiered, Synergy, Fortune or Grandma
            if (upgrade.tier == "fortune") {
                // Fortune
                upgrades[upgrade.id] =
                    (upgrade.buildingTie.storedTotalCps *
                        Game.globalCpsMult *
                        0.07) /
                    upgrade.getPrice();
                continue;
            }
            if (upgrade.tier == "synergy1" || upgrade.tier == "synergy2") {
                // Synergy
                upgrades[upgrade.id] =
                    (upgrade.buildingTie.storedTotalCps *
                        Game.globalCpsMult *
                        0.05 *
                        upgrade.buildingTie1.amount +
                        upgrade.buildingTie1.storedTotalCps *
                            Game.globalCpsMult *
                            0.001 *
                            upgrade.buildingTie.amount) /
                    upgrade.getPrice();
                continue;
            }
            if (upgrade.buildingTie == upgrade.buildingTie1) {
                // Tiered
                // upgrades[upgrade.id] = upgrade.buildingTie.storedTotalCps / upgrade.getPrice();
                if (!Game.Tiers[upgrade.tier].special) {
                    var tierAdd = 1;
                    //unshackled
                    let me = upgrade.buildingTie;
                    if (
                        Game.ascensionMode != 1 &&
                        Game.Has(me.unshackleUpgrade) &&
                        Game.Has(Game.Tiers[upgrade.tier].unshackleUpgrade)
                    )
                        tierAdd += me.id == 1 ? 0.5 : (20 - me.id) * 0.1;

                    upgrades[upgrade.id] =
                        (upgrade.buildingTie.storedTotalCps *
                            Game.globalCpsMult *
                            tierAdd) /
                        upgrade.getPrice();
                    continue;
                }
            }
            if (upgrade.buildingTie1 === undefined) {
                // Grandma
                upgrades[upgrade.id] =
                    ((upgrade.buildingTie.storedTotalCps *
                        Game.globalCpsMult *
                        0.01 *
                        Game.Objects.Grandma.amount) /
                        (upgrade.buildingTie.id - 1) +
                        Game.Objects.Grandma.storedTotalCps *
                            Game.globalCpsMult) /
                    upgrade.getPrice();
                continue;
            }
        }
    }
    return upgrades;
};

AutoBuy.BuyOptimal = function () {
    var buildings = AutoBuy.CPSPCperBuilding();
    var upgrades = AutoBuy.CPSPCperUpgrade();
    var optimaltype = "building";
    var optimal = "";
    var optimalCPSPC = 0;
    for (const [building, CPSPC] of Object.entries(buildings)) {
        if (CPSPC > optimalCPSPC) {
            optimal = building;
            optimalCPSPC = CPSPC;
        }
    }
    for (const [upgradeId, CPSPC] of Object.entries(upgrades)) {
        if (CPSPC > optimalCPSPC) {
            optimal = upgradeId;
            optimalCPSPC = CPSPC;
            optimaltype = "upgrade";
        }
    }
    if (optimal) {
        if (optimaltype == "building") {
            var optimalObject = Game.Objects[optimal];
            if (
                Game.cookies >=
                optimalObject.getPrice() +
                    Game.cookiesPsRaw * AutoBuy.CookieBank()
            ) {
                Game.buyMode = 1;
                optimalObject.buy(1);
            }
        }
        if (optimaltype == "upgrade") {
            var optimalObject = Game.UpgradesById[optimal];
            if (
                Game.cookies >=
                optimalObject.getPrice() +
                    Game.cookiesPsRaw * AutoBuy.CookieBank()
            ) {
                optimalObject.buy();
            }
        }
    }
};

AutoBuy.GetOptimal = function () {
    var buildings = AutoBuy.CPSPCperBuilding();
    var upgrades = AutoBuy.CPSPCperUpgrade();
    var optimaltype = "building";
    var optimal = "";
    var optimalCPSPC = 0;
    for (const [building, CPSPC] of Object.entries(buildings)) {
        if (CPSPC > optimalCPSPC) {
            optimal = building;
            optimalCPSPC = CPSPC;
        }
    }
    for (const [upgradeId, CPSPC] of Object.entries(upgrades)) {
        if (CPSPC > optimalCPSPC) {
            optimal = upgradeId;
            optimalCPSPC = CPSPC;
            optimaltype = "upgrade";
        }
    }
    if (optimal) {
        var optimalObject;
        if (optimaltype == "building") {
            optimalObject = Game.Objects[optimal];
        }
        if (optimaltype == "upgrade") {
            optimalObject = Game.UpgradesById[optimal];
        }
        console.log(optimalObject);
        console.log(Beautify(optimalObject.getPrice()));
        console.log(optimalCPSPC);
    }
};

AutoBuy.FTHOF = function () {
    var mult = 1;
    var wizard = Game.Objects["Wizard tower"];
    var minigame = wizard.minigame;
    if (minigame) {
        for (const [name, buff] of Object.entries(Game.buffs)) {
            mult *= buff.multCpS;
            if (
                (name == "Click frenzy" || name == "Dragonflight") &&
                !Game.buffs["Devastation"]
            ) {
                minigame.castSpell(minigame.spells["hand of fate"]);
                if (minigame.magic >= 23) {
                    let amount = wizard.amount - 22;
                    wizard.sell(amount);
                    Game.shimmers.forEach(function (shimmer) {
                        if (
                            (shimmer.type == "golden" && shimmer.wrath == 0) ||
                            shimmer.force == "blood frenzy"
                        ) {
                            shimmer.pop();
                        }
                    });
                    minigame.computeMagicM();
                    minigame.castSpell(minigame.spells["hand of fate"]);
                    wizard.buy(amount);
                }
                AutoBuy.CPSperBuilding();
                for (const [name, building] of Object.entries(Game.Objects)) {
                    if (
                        Game.Objects.Temple.minigame.slot.includes(2) &&
                        AutoBuy.buildingsCPS[name] / Game.cookiesPsRaw <=
                            0.01 &&
                        !building.minigame
                    ) {
                        let amount = building.amount;
                        building.sell(-1);
                        building.buy(amount);
                    }
                }
            }
        }
        if (mult >= 50) {
            if (minigame.magic == minigame.magicM || mult > 100)
                minigame.castSpell(minigame.spells["hand of fate"]);
        }
    }
};

AutoBuy.init = function () {
    Game.registerHook("logic", () => {
        AutoBuy.BuyOptimal();
        AutoBuy.FTHOF();
    });
    AutoBuy.click = setInterval(Game.ClickCookie, 50);
    AutoBuy.golden = setInterval(function () {
        Game.shimmers.forEach(function (shimmer) {
            if (
                (shimmer.type == "golden" && shimmer.wrath == 0) ||
                shimmer.force == "blood frenzy" ||
                shimmer.force == "cursed finger"
            ) {
                shimmer.pop();
            }
        });
    }, 500);
};

Game.registerMod("AutoBuy", AutoBuy);
