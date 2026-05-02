// app/cgv/page.tsx
export default function CGVPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-neutral-900">
        Place V – Espace Saxon
        <br />
        Conditions Générales d'Utilisation et de Vente
      </h1>
      <p className="mt-2 text-sm text-neutral-400">Version du 27 avril 2026</p>

      <div className="mt-10 space-y-10 text-neutral-700">

        {/* Préambule */}
        <section>
          <h2 className="text-xl font-semibold text-neutral-900">Préambule</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Place V est une association loi 1901 (ci-après « l'Association ») dont le siège social est situé à Bouliac (33270),
            au sein de l'Espace Saxon. L'Association exploite une plateforme de réservation en ligne accessible depuis le site
            placev.co (ci-après « la Plateforme »), permettant à toute personne physique (ci-après « l'Utilisateur ») de créer
            un compte, d'acquérir des crédits de demi-journée et de réserver des plages d'accès à l'espace de coworking.
          </p>
          <p className="mt-3 text-sm leading-relaxed">
            Les présentes Conditions Générales d'Utilisation et de Vente (ci-après « CGU/CGV ») régissent l'ensemble des
            relations entre l'Association et l'Utilisateur. Toute utilisation de la Plateforme ou tout achat de crédit implique
            l'acceptation sans réserve des présentes CGU/CGV.
          </p>
        </section>

        {/* Partie I */}
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wide text-neutral-500">
            Partie I – Conditions Générales d'Utilisation
          </h2>

          <div className="mt-6 space-y-8">
            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 1 – Création de compte</h3>
              <p className="mt-3 text-sm leading-relaxed">
                Tout Utilisateur souhaitant accéder aux services de réservation doit créer un compte personnel sur la Plateforme.
                La création d'un compte est soumise aux conditions suivantes :
              </p>
              <ul className="mt-3 space-y-1 text-sm leading-relaxed list-none pl-4">
                <li>– Un seul compte par adresse e-mail. Toute création de comptes multiples avec une même adresse est interdite.</li>
                <li>– L'Utilisateur s'engage à fournir des informations exactes, complètes et à jour.</li>
                <li>– L'Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion.</li>
                <li>– L'Utilisateur s'engage à informer l'Association sans délai en cas de perte, vol ou utilisation non autorisée de son compte.</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed">
                L'Association se réserve le droit de suspendre ou supprimer tout compte en cas de non-respect des présentes CGU/CGV.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 2 – Utilisation de la Plateforme</h3>
              <p className="mt-3 text-sm leading-relaxed">La Plateforme permet à l'Utilisateur de :</p>
              <ul className="mt-3 space-y-1 text-sm leading-relaxed list-none pl-4">
                <li>– Créer et gérer son compte personnel.</li>
                <li>– Acquérir des crédits de demi-journée et gérer son solde.</li>
                <li>– Effectuer et consulter ses réservations de plages horaires à l'Espace Saxon.</li>
                <li>– Soumettre une demande de contact pour la location de la salle de réunion (voir Article 7).</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed">
                L'Utilisateur s'engage à utiliser la Plateforme conformément à sa destination et dans le respect des présentes
                CGU/CGV, des lois et règlements en vigueur, ainsi que des règles intérieures de l'Espace Saxon.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 3 – Disponibilité et modifications</h3>
              <p className="mt-3 text-sm leading-relaxed">
                L'Association s'efforce d'assurer la disponibilité permanente de la Plateforme. Elle ne saurait être tenue
                responsable des interruptions liées à des opérations de maintenance, des défaillances techniques ou des événements
                indépendants de sa volonté.
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                L'Association se réserve le droit de faire évoluer les fonctionnalités de la Plateforme à tout moment, sans que
                cela n'affecte les droits acquis par l'Utilisateur.
              </p>
            </section>
          </div>
        </div>

        {/* Partie II */}
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wide text-neutral-500">
            Partie II – Conditions Générales de Vente
          </h2>

          <div className="mt-6 space-y-8">
            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 4 – Objet</h3>
              <p className="mt-3 text-sm leading-relaxed">
                Les présentes CGV régissent la vente de crédits de demi-journée par l'Association à tout Utilisateur disposant
                d'un compte actif sur la Plateforme. Une demi-journée correspond à une plage horaire d'accès à l'Espace Saxon,
                selon les modalités affichées sur la Plateforme.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 5 – Tarifs</h3>
              <p className="mt-3 text-sm leading-relaxed">
                Les crédits de demi-journée sont proposés aux tarifs suivants, toutes taxes comprises :
              </p>
              <ul className="mt-3 space-y-1 text-sm leading-relaxed list-none pl-4">
                <li>– Tarif plein : 8,00 €</li>
                <li>– Tarif Bouliacais (justificatif de domicile requis) : 7,00 €</li>
                <li>– Tarif demandeur d'emploi (justificatif Pôle Emploi / France Travail requis) : 4,00 €</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed">
                L'Association se réserve le droit de modifier ses tarifs à tout moment. Les crédits déjà acquis restent valables
                au tarif auquel ils ont été achetés.
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                Pour bénéficier d'un tarif préférentiel, l'Utilisateur doit fournir un justificatif valide lors de son inscription
                ou sur première demande de l'Association.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 6 – Acquisition de crédits et paiement</h3>
              <p className="mt-3 text-sm leading-relaxed">
                L'Utilisateur peut acquérir autant de crédits de demi-journée qu'il le souhaite. Les crédits sont valables sans
                limitation de durée et ne sont ni cessibles ni transmissibles à un tiers.
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                Le paiement s'effectue en ligne, de manière sécurisée, par carte bancaire via la solution Stripe. En validant son
                achat, l'Utilisateur accepte les conditions d'utilisation de Stripe. Les crédits sont crédités sur le compte de
                l'Utilisateur dès confirmation du paiement.
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                L'Association ne collecte ni ne stocke aucune donnée bancaire. L'ensemble des opérations de paiement est pris en
                charge exclusivement par Stripe, prestataire de services de paiement agréé.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 7 – Location de la salle de réunion</h3>
              <p className="mt-3 text-sm leading-relaxed">
                La salle de réunion de l'Espace Saxon peut faire l'objet d'une location ponctuelle, distincte du système de
                crédits de coworking.
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                Toute demande de location s'effectue via le formulaire de contact disponible sur placev.co. L'Utilisateur est
                invité à renseigner son nom et son adresse e-mail. L'échange relatif au besoin, aux disponibilités et au devis
                se déroule ensuite exclusivement par e-mail entre l'Utilisateur et l'Association.
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                La location est confirmée uniquement après accord écrit de l'Association. Aucune réservation n'est validée par
                le seul dépôt du formulaire de contact.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 8 – Annulation et remboursement</h3>
              <p className="mt-3 text-sm leading-relaxed">
                Les crédits achetés ne sont ni remboursables ni échangeables, sauf dans les cas suivants :
              </p>
              <ul className="mt-3 space-y-1 text-sm leading-relaxed list-none pl-4">
                <li>
                  – Annulation d'une réservation à l'initiative de l'Association : le ou les crédits concernés sont
                  automatiquement recrédités sur le compte de l'Utilisateur dans les meilleurs délais.
                </li>
                <li>
                  – Fermeture définitive de l'Espace Saxon ou dissolution de l'Association : les crédits non utilisés feront
                  l'objet d'un remboursement monétaire au prorata via Stripe.
                </li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed">
                Toute demande de remboursement exceptionnel doit être adressée à{" "}
                <a href="mailto:contact@placev.co" className="underline hover:text-neutral-900">contact@placev.co</a>.
                L'Association s'engage à y répondre dans un délai de 15 jours ouvrés.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 9 – Droit de rétractation</h3>
              <p className="mt-3 text-sm leading-relaxed">
                Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux
                prestations de services entièrement exécutées avant la fin du délai légal. En acquérant des crédits et en les
                utilisant, l'Utilisateur renonce expressément à son droit de rétractation pour les crédits consommés.
              </p>
            </section>
          </div>
        </div>

        {/* Partie III */}
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wide text-neutral-500">
            Partie III – Protection des Données Personnelles (RGPD)
          </h2>

          <div className="mt-6 space-y-8">
            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 10 – Responsable du traitement</h3>
              <p className="mt-3 text-sm leading-relaxed">
                Place V, association loi 1901 sise à Bouliac (33270), est responsable du traitement des données personnelles
                collectées via la Plateforme et le formulaire de contact. Contact :{" "}
                <a href="mailto:contact@placev.co" className="underline hover:text-neutral-900">contact@placev.co</a>.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 11 – Données collectées et finalités</h3>
              <p className="mt-3 text-sm leading-relaxed">
                Les données collectées sont strictement limitées à ce qui est nécessaire aux finalités suivantes :
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed list-none pl-4">
                <li>
                  – <span className="font-medium">Gestion des comptes Utilisateurs et authentification</span> : adresse e-mail,
                  prénom et nom. Base légale : exécution du contrat.
                </li>
                <li>
                  – <span className="font-medium">Traitement des paiements et émission des justificatifs</span> : données de
                  transaction transmises à Stripe. Base légale : exécution du contrat et obligation légale.
                </li>
                <li>
                  – <span className="font-medium">Gestion des tarifs préférentiels</span> : justificatifs de domicile ou de
                  situation professionnelle, conservés le temps nécessaire à la vérification. Base légale : exécution du contrat.
                </li>
                <li>
                  – <span className="font-medium">Traitement des demandes de location de salle</span> : nom et e-mail collectés
                  via le formulaire. Base légale : intérêt légitime de l'Association à répondre aux demandes entrantes.
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 12 – Durée de conservation</h3>
              <p className="mt-3 text-sm leading-relaxed">
                Les données sont conservées pendant la durée d'activité du compte, puis archivées conformément aux obligations
                légales (notamment comptables : 10 ans). Les données relatives aux demandes de location sans suite sont supprimées
                dans un délai de 12 mois à compter du dernier contact.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 13 – Partage des données</h3>
              <p className="mt-3 text-sm leading-relaxed">
                Les données personnelles ne sont jamais vendues ni cédées à des tiers à des fins commerciales. Elles peuvent être
                transmises uniquement aux sous-traitants techniques strictement nécessaires à l'exploitation de la Plateforme,
                notamment Stripe pour le traitement des paiements, lesquels sont soumis à des obligations de confidentialité
                équivalentes.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 14 – Droits des Utilisateurs</h3>
              <p className="mt-3 text-sm leading-relaxed">
                Conformément au RGPD et à la loi Informatique et Libertés, tout Utilisateur dispose des droits suivants sur ses
                données :
              </p>
              <ul className="mt-3 space-y-1 text-sm leading-relaxed list-none pl-4">
                <li>– <span className="font-medium">Droit d'accès</span> : obtenir une copie des données le concernant.</li>
                <li>– <span className="font-medium">Droit de rectification</span> : corriger des données inexactes ou incomplètes.</li>
                <li>– <span className="font-medium">Droit à l'effacement</span> : demander la suppression de ses données, sous réserve des obligations légales de conservation.</li>
                <li>– <span className="font-medium">Droit à la portabilité</span> : recevoir ses données dans un format structuré et lisible.</li>
                <li>– <span className="font-medium">Droit d'opposition et de limitation</span> : s'opposer à certains traitements ou en demander la limitation.</li>
              </ul>
              <p className="mt-3 text-sm leading-relaxed">
                Ces droits s'exercent par e-mail à{" "}
                <a href="mailto:contact@placev.co" className="underline hover:text-neutral-900">contact@placev.co</a>.
                L'Association s'engage à répondre dans un délai d'un mois. En cas de réponse insatisfaisante, l'Utilisateur peut
                saisir la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-900">www.cnil.fr</a>).
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 15 – Cookies</h3>
              <p className="mt-3 text-sm leading-relaxed">
                La Plateforme peut utiliser des cookies strictement nécessaires à son fonctionnement (authentification, session).
                Aucun cookie publicitaire ou de traçage tiers n'est déposé sans le consentement préalable de l'Utilisateur.
              </p>
            </section>
          </div>
        </div>

        {/* Partie IV */}
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wide text-neutral-500">
            Partie IV – Dispositions Communes
          </h2>

          <div className="mt-6 space-y-8">
            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 16 – Responsabilité</h3>
              <p className="mt-3 text-sm leading-relaxed">
                L'Association décline toute responsabilité en cas de dommages indirects résultant de l'utilisation de la
                Plateforme ou de l'Espace Saxon. Sa responsabilité est limitée au montant des crédits acquis et non utilisés
                par l'Utilisateur.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 17 – Modification des CGU/CGV</h3>
              <p className="mt-3 text-sm leading-relaxed">
                L'Association se réserve le droit de modifier les présentes CGU/CGV à tout moment. L'Utilisateur est informé de
                toute modification substantielle par e-mail ou notification sur la Plateforme. Le maintien de l'utilisation de
                la Plateforme après notification vaut acceptation des nouvelles conditions.
              </p>
            </section>

            <section>
              <h3 className="text-base font-semibold text-neutral-900">Article 18 – Résolution des litiges</h3>
              <p className="mt-3 text-sm leading-relaxed">
                En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À
                défaut d'accord, les tribunaux compétents sont ceux du ressort du siège social de l'Association. Les présentes
                CGU/CGV sont régies par le droit français.
              </p>
            </section>
          </div>
        </div>

        {/* Contact */}
        <section className="border-t border-neutral-200 pt-8">
          <h2 className="text-base font-semibold text-neutral-900">Contact</h2>
          <ul className="mt-3 space-y-1 text-sm leading-relaxed list-none">
            <li>
              – E-mail :{" "}
              <a href="mailto:contact@placev.co" className="underline hover:text-neutral-900">contact@placev.co</a>
            </li>
            <li>– Site web : placev.co</li>
            <li>– Adresse : Espace Saxon, Bouliac (33270)</li>
          </ul>
          <p className="mt-6 text-xs text-neutral-400">
            Document établi le 27 avril 2026 — Place V, association loi 1901
          </p>
        </section>

      </div>
    </div>
  )
}
