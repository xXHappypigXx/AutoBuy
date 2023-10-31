var AutoBuy = {};

// Computes the cps and how much it boosts other Buildings
AutoBuy.CPSperBuilding = function () {
    var buildings = {};
    for (const [building, me] of Object.entries(Game.Objects)) {
        // Ripped straight out of the source code.
        // There was a comment that said the math might be off though
        if (me.amount > 0) {
            var synergiesWith = {};
            var synergyBoost = 0;

            if (me.name == 'Grandma') {
                for (var i in Game.GrandmaSynergies) {
                    if (Game.Has(Game.GrandmaSynergies[i])) {
                        var other = Game.Upgrades[Game.GrandmaSynergies[i]].buildingTie;
                        var mult = me.amount * 0.01 * (1 / (other.id - 1));
                        var boost = (other.storedTotalCps * Game.globalCpsMult) - (other.storedTotalCps * Game.globalCpsMult) / (1 + mult);
                        synergyBoost += boost;
                        if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                        synergiesWith[other.plural] += mult;
                    }
                }
            }
            else if (me.name == 'Portal' && Game.Has('Elder Pact')) {
                var other = Game.Objects['Grandma'];
                var boost = (me.amount * 0.05 * other.amount) * Game.globalCpsMult;
                synergyBoost += boost;
                if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                synergiesWith[other.plural] += boost / (other.storedTotalCps * Game.globalCpsMult);
            }

            for (var i in me.synergies) {
                var it = me.synergies[i];
                if (Game.Has(it.name)) {
                    var weight = 0.05;
                    var other = it.buildingTie1;
                    if (me == it.buildingTie1) { weight = 0.001; other = it.buildingTie2; }
                    var boost = (other.storedTotalCps * Game.globalCpsMult) - (other.storedTotalCps * Game.globalCpsMult) / (1 + me.amount * weight);
                    synergyBoost += boost;
                    if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                    synergiesWith[other.plural] += me.amount * weight;
                }
            }

            buildings[building] = me.storedCps * Game.globalCpsMult + synergyBoost / me.amount;
        } else buildings[building] = me.baseCps * Game.globalCpsMult;
    }
    return buildings;
}

// Computes the cps per cookie spent for every building
AutoBuy.CPSPCperBuilding = function () {
    var buildings = {};
    for (const [building, me] of Object.entries(Game.Objects)) {
        // Ripped straight out of the source code.
        // There was a comment that said the math might be off though
        if (me.amount > 0) {
            var synergiesWith = {};
            var synergyBoost = 0;

            if (me.name == 'Grandma') {
                for (var i in Game.GrandmaSynergies) {
                    if (Game.Has(Game.GrandmaSynergies[i])) {
                        var other = Game.Upgrades[Game.GrandmaSynergies[i]].buildingTie;
                        var mult = me.amount * 0.01 * (1 / (other.id - 1));
                        var boost = (other.storedTotalCps * Game.globalCpsMult) - (other.storedTotalCps * Game.globalCpsMult) / (1 + mult);
                        synergyBoost += boost;
                        if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                        synergiesWith[other.plural] += mult;
                    }
                }
            }
            else if (me.name == 'Portal' && Game.Has('Elder Pact')) {
                var other = Game.Objects['Grandma'];
                var boost = (me.amount * 0.05 * other.amount) * Game.globalCpsMult;
                synergyBoost += boost;
                if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                synergiesWith[other.plural] += boost / (other.storedTotalCps * Game.globalCpsMult);
            }

            for (var i in me.synergies) {
                var it = me.synergies[i];
                if (Game.Has(it.name)) {
                    var weight = 0.05;
                    var other = it.buildingTie1;
                    if (me == it.buildingTie1) { weight = 0.001; other = it.buildingTie2; }
                    var boost = (other.storedTotalCps * Game.globalCpsMult) - (other.storedTotalCps * Game.globalCpsMult) / (1 + me.amount * weight);
                    synergyBoost += boost;
                    if (!synergiesWith[other.plural]) synergiesWith[other.plural] = 0;
                    synergiesWith[other.plural] += me.amount * weight;
                }
            }

            buildings[building] = (me.storedCps * Game.globalCpsMult + synergyBoost / me.amount) / me.getPrice();
        } else buildings[building] = me.baseCps * Game.globalCpsMult / me.getPrice();
    }
    return buildings;
}

// Computes the cps per cookie spent for every Upgrade in store
AutoBuy.CPSPCperUpgrade = function () {
    var upgrades = {};
    for (const upgrade of Game.UpgradesInStore) {
        upgrades[upgrade.id]
    }
    return upgrades;
}

AutoBuy.BuyOptimal = function () {
    var buildings = AutoBuy.CPSPCperBuilding();
    var optimaltype = "building";
    var optimal = "";
    var optimalCPSPC = 0;
    for (const [building, CPSPC] of Object.entries(buildings)) {
        if (CPSPC > optimalCPSPC) {
            optimal = building;
            optimalCPSPC = CPSPC;
        }
    }
    if (optimal) {
        if (optimaltype == "building") {
            var optimalObject = Game.Objects[optimal];
            if (Game.cookies - Game.cookiesPsRaw * AutoBuy.CookieBank >= optimalObject.getPrice()) {
                Game.buyMode = 1;
                optimalObject.buy(1);
            }
        }
    }
}

AutoBuy.FTHOF = function () {
    var mult = 1;
    var wizard = Game.Objects["Wizard tower"];
    var minigame = wizard.minigame;
    for (const [name, buff] of Object.entries(Game.buffs)) {
        mult *= buff.multCpS;
        if (name == "Click frenzy" && !Game.buffs["Devastation"]) {
            minigame.castSpell(minigame.spells["hand of fate"]);
            if (minigame.magic >= 23) {
                let amount = wizard.amount - 22;
                wizard.sell(amount);
                Game.shimmers.forEach(function (shimmer) {
                    if ((shimmer.type == "golden" && shimmer.wrath == 0) || shimmer.force == "blood frenzy") {
                        shimmer.pop();
                    }
                });
                minigame.castSpell(minigame.spells["hand of fate"]);
                wizard.buy(amount);
            }
            for (const [name, building] of Object.entries(Game.Objects)) {
                if (building.storedTotalCps / Game.cookiesPsRaw <= 0.01 && !building.minigame) {
                    let amount = building.amount;
                    building.sell(-1);
                    building.buy(amount);
                }
            }
        }
    }
    if (mult >= 5) {
            if (minigame.magic == minigame.magicM || mult > 100)
                minigame.castSpell(minigame.spells["hand of fate"]);
    }
}

AutoBuy.init = function () {
    AutoBuy.CookieBank = 8400;
    Game.registerHook('logic', () => {
        AutoBuy.BuyOptimal();
        AutoBuy.FTHOF();
    })
    AutoBuy.click = setInterval(Game.ClickCookie, 20);
    AutoBuy.golden = setInterval(function () {
        Game.shimmers.forEach(function (shimmer) {
            if ((shimmer.type == "golden" && shimmer.wrath == 0) || shimmer.force == "blood frenzy") {
                shimmer.pop();
            }
        });
    }, 500);
}

Game.registerMod("AutoBuy", AutoBuy);